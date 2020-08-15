import * as React from "react"
import * as d3 from "d3"
import axios from "axios"

interface Props {
    height: number,
    width: number,
    offsetX: number
}

interface State {
    drugNames: string[],
    drugIDs: number[],
    rankList: {
        [listname: string]: number[]
    }
}

export default class Drug extends React.Component<Props, State>{
    public maxRank = 50; padding = 20; labelWidth = 140; labelHeight = 18; fontSize = 12; dotR = 8
    constructor(props: Props) {
        super(props)
        this.state = {
            drugNames: [],
            drugIDs: [],
            rankList: {}
        }
    }
    componentDidMount() {
        const drugCSV = './data/predictions/drug-rankings.tsv'
        axios.get(drugCSV)
            .then(res => {
                let response = res.data
                let lines = response.split('\n')

                let rankNames: string[] = lines[0].split('\t').slice(2),
                    drugNames: State['drugNames'] = [],
                    drugIDs: State['drugIDs'] = [],
                    rankList: State['rankList'] = {}

                rankNames.forEach(name => {
                    rankList[name] = []
                })

                for (let i = 1; i < this.maxRank; i++) {
                    let cells = lines[i].split('\t')
                    drugIDs.push(cells[0])
                    drugNames.push(cells[1])
                    cells.slice(2).forEach(
                        (rank: number, i: number) => rankList[rankNames[i]].push(rank)
                    )
                }

                this.setState({ drugIDs, drugNames, rankList })
            })
    }
    drawRanking() {
        
        let { height, width } = this.props
        let { drugNames, drugIDs, rankList } = this.state
        if (drugNames.length==0) return

        let rankMethods = Object.keys(rankList).slice(1)
        let yScale = d3.scaleLinear()
            .domain([1, this.maxRank])
            .range([this.fontSize, height - 2 * this.padding]),
            xScale = d3.scalePoint()
                .padding(1)
                .domain(rankMethods)
                .range([this.labelWidth, width - 2 * this.padding])


        let labels = drugNames.map((name, i) => {
            return <g key={name} transform={`translate(0, ${yScale(i + 1)})`}>
                <rect width={this.labelWidth} height={this.labelHeight} fill='none' stroke='gray' />
                <text
                    x={this.labelWidth / 2} y={this.labelHeight / 2 + this.fontSize / 2}
                    fontSize={this.fontSize} textAnchor="middle"
                >
                    {name}
                </text>
            </g>
        })

        let ranks = rankMethods.map(rankName => {
            return <g transform={`translate(${xScale(rankName)}, 0)`} key={rankName}>
                <text textAnchor="middle">{rankName}</text>
                <line x1={0} x2={0} y1={yScale.range()[0]} y2={yScale.range()[1]} stroke='gray'/>
            </g>
        })

        let labelGroup = <g className="labelGroup" key="lableGroup">
           
                <text
                    x={this.labelWidth / 2} 
                    fontSize={this.fontSize} textAnchor="middle"
                >
                    acRank (top {this.maxRank})
                </text>
            {labels}
        </g>

        let rankGroup = <g key="rankGroup" className="rankGroup">
            {ranks}
        </g>

        let links = rankList[rankMethods[0]].map((_, idx)=>{
            let previousX = xScale.range()[0], previousY = yScale(idx+1) + this.labelHeight/2
            return <g key={idx}>{rankMethods.map(name=>{
                let ranking = rankList[name][idx]
                let currentX = xScale(name)||0, currentY = yScale(ranking) + this.labelHeight/2
                if ( Math.max(previousY, currentY) > yScale.range()[1] || Math.min(previousY, currentY) < this.labelHeight/2) return <g key={name}/>
                // if ( Math.min(previousY, currentY) < this.labelHeight/2 ) {
                //     console.info(idx, ranking, yScale(ranking), name)
                // }
                return <g key={name}>
                    <line key={name} x1={previousX} y1={previousY} x2={currentX} y2={currentY} stroke="gray" 
                     marker-start="url(#dot)" marker-mid="url(#dot)"  marker-end="url(#dot)"/> 
                    <text x={previousX} y={previousY + this.dotR*0.5} textAnchor="middle" fontSize={this.dotR*1.2}>{idx+1}</text>
                     <text x={previousX = currentX} y={( previousY = currentY) +this.dotR*0.5} textAnchor="middle" fontSize={this.dotR*1.2}>{ranking}</text>
                     
                </g>
            })}
            </g>
        })
        // console.info(rankMethods.map(name=>rankList[name][12]))
        // console.info(rankMethods.map(name=>rankList[name][13]))
        let linkGroup = <g className="linkGroup" key="linkGroup">
            {links}
        </g>


        return [labelGroup, rankGroup, linkGroup]
    }
    render() {

        return <g className='drug' transform={`translate(${this.props.offsetX + this.padding}, ${this.padding})`}>
            <defs>
                <marker id="dot" viewBox={`0 0 ${this.dotR*2} ${this.dotR*2}`} refX={this.dotR} refY={this.dotR} markerWidth={this.dotR+4} markerHeight={this.dotR+4} >
                    <circle cx={this.dotR}  cy={this.dotR}  r={this.dotR}  fill="white" stroke="gray" />
                </marker>
            </defs>
            {this.drawRanking()}
        </g>
    }
}