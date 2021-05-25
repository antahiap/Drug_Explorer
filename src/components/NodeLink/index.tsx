import React from 'react';
import { Card, Tooltip } from 'antd';
import { StateConsumer } from 'stores';
import { IState, IAttentionTree } from 'types';
import * as d3 from 'd3';
import { getNodeColor } from 'helpers/color';
import {
  cropText,
  VIRUS_ICON,
  DRUG_ICON,
  getTextWidth,
  LOADING_ICON,
} from 'helpers';

import './index.css';
interface Props {
  width: number;
  height: number;
  globalState: IState;
}

class NodeLink extends React.Component<Props, {}> {
  titleHeight = 36;
  margin = 10;
  padding = 10;
  nodeHeight = 20;
  fontSize = 14;
  labelLength = 150;
  midGap = 60; // the gaph between two trees

  drawNodeAttentionHorizontal(
    nodeAttention: IAttentionTree,
    stepGap: number,
    edgeThreshold: number
  ) {
    const { width } = this.props;
    const svgWidth = width - 2 * this.padding - 2 * this.margin;
    const {
      nodeNameDict,
      edgeTypes,
      selectedPathNodes,
    } = this.props.globalState;

    let pruneEdge = (
      node: IAttentionTree,
      threshold: number
    ): IAttentionTree => {
      if (node.children.length > 0) {
        node = {
          ...node,
          children: node.children
            .filter((d) => d.score >= threshold)
            .map((node) => pruneEdge(node, threshold)),
        };
      }
      return node;
    };

    let nodeAttentionFiltered = pruneEdge(nodeAttention, edgeThreshold);

    const rootNode = d3.hierarchy(nodeAttentionFiltered);
    const d3Tree = d3
      .tree<IAttentionTree>()
      .nodeSize([this.nodeHeight + 2, stepGap]);

    const root = d3Tree(rootNode);

    const linkGene = d3
      .linkHorizontal<any, d3.HierarchyPointLink<IAttentionTree>, any>()
      // modify the source and target x, y to make space for node
      .source((d) => {
        const newX =
          root.data.nodeType === 'drug'
            ? svgWidth / 2 -
              this.midGap / 2 -
              this.labelLength -
              d.source.y -
              this.labelLength / 2
            : d.source.y + this.labelLength / 2;
        const newY = d.source.x;

        return { x: newX, y: newY };
      })
      .target((d) => {
        const newX =
          root.data.nodeType === 'drug'
            ? svgWidth / 2 -
              this.midGap / 2 -
              this.labelLength -
              d.target.y +
              this.labelLength / 2
            : d.target.y - this.labelLength / 2;
        const newY = d.target.x;

        return { x: newX, y: newY };
      })
      .x((d) => d.x)
      .y((d) => d.y);

    const maxScore = Math.max(
      ...root.links().map((link) => link.target.data.score)
    );

    let widthScale = d3.scaleLinear().domain([0, maxScore]).range([1, 5]);

    const links = root.links().map((link, i) => {
      const edgeInfo = link.target.data.edgeInfo.replace('rev_', '');
      const edgeType = edgeTypes[edgeInfo]['edgeInfo'] || edgeInfo;
      return (
        <Tooltip
          title={edgeType}
          key={`${link.source.data.nodeId}=>${link.target.data.nodeId}_link${i}`}
          destroyTooltipOnHide
        >
          <g>
            <path
              d={linkGene(link)!}
              className={`link ${link.source.data.nodeId}=>${link.target.data.nodeId}`}
              fill="none"
              stroke="gray"
              strokeWidth={widthScale(link.target.data.score)}
              opacity={selectedPathNodes.length > 0 ? 0.5 : 1}
            />
            <path
              d={linkGene(link)!}
              className="mask"
              fill="none"
              stroke="transparent"
              strokeWidth="3"
            />
          </g>
        </Tooltip>
      );
    });

    const allY = root.descendants().map((node) => node.x);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const height =
      maxY - minY + this.nodeHeight + 2 * this.padding + 2 * this.margin;

    const nodes = root.descendants().map((node, i) => {
      let { nodeId, nodeType } = node.data;
      let nodeFullName = nodeNameDict[nodeType][nodeId];
      if (nodeFullName === undefined) {
        nodeId = nodeId.replace(/_/g, '') + '.0'; // the id of a merged node is xxx_xxx_xxxx
        nodeFullName = nodeNameDict[nodeType][nodeId];
      }
      let nodeShortName = cropText(
        nodeFullName,
        12,
        this.labelLength - 25 - getTextWidth('..(0.00)', 14)
      );
      let tooltipTitle = nodeShortName?.includes('..') ? nodeFullName : '';
      let icon_path = '';
      if (nodeType === 'disease') icon_path = VIRUS_ICON;
      if (nodeType === 'drug') icon_path = DRUG_ICON;

      const isHighlighted =
        selectedPathNodes.length === 0 ||
        (selectedPathNodes.map((d) => d.nodeType).includes(nodeType) &&
          selectedPathNodes.map((d) => d.nodeId).includes(nodeId));

      return (
        <Tooltip
          title={tooltipTitle}
          key={`node${i}_${nodeFullName}`}
          destroyTooltipOnHide
          mouseEnterDelay={0.3}
        >
          <g
            className={`${nodeId} node`}
            transform={`translate(${
              root.data.nodeType === 'drug'
                ? svgWidth / 2 - this.midGap / 2 - this.labelLength - node.y
                : node.y
            }, ${node.x})`}
            cursor="pointer"
          >
            <rect
              width={this.labelLength}
              height={this.nodeHeight}
              fill={getNodeColor(nodeType)}
              x={(-1 * this.labelLength) / 2}
              y={-this.nodeHeight / 2}
              opacity={isHighlighted ? 1 : 0.2}
            />
            <path
              className="virus_icon"
              d={icon_path}
              transform={`translate(${(-1 * this.labelLength) / 2 + 2}, ${
                -this.nodeHeight / 2
              }) scale(0.04)`}
              fill="white"
            />
            <text
              fill="white"
              fontSize={this.fontSize}
              transform={`translate(${(-1 * this.labelLength) / 2 + 25}, ${
                (this.nodeHeight - this.fontSize) / 2
              })`}
            >
              {`${nodeShortName}
              ${node.depth > 0 ? ':' + node.data.score.toFixed(2) : ''}`}
            </text>
          </g>
        </Tooltip>
      );
    });

    return {
      content: [
        <g key="links" className="links">
          {links}
        </g>,
        <g key="nodes" className="nodes">
          {nodes}
        </g>,
      ],
      height: height,
    };
  }
  drawSubgraph() {
    let { attention, edgeThreshold } = this.props.globalState;
    let { width } = this.props;
    const svgWidth = width - 2 * this.margin - 2 * this.padding;

    let stepGap = (svgWidth - 2 * this.labelLength - this.midGap) / 4;
    let maxHeight = 0;
    const content = Object.keys(attention).map((nodeKey: string, idx) => {
      const { height, content } = this.drawNodeAttentionHorizontal(
        attention[nodeKey],
        stepGap,
        edgeThreshold
      );
      maxHeight = Math.max(maxHeight, height);
      return (
        <g
          className={nodeKey}
          key={nodeKey}
          transform={`translate(${
            ((svgWidth + this.midGap) / 2) * idx + this.labelLength / 2
          }, ${height / 2 + this.padding + this.margin + this.nodeHeight})`}
        >
          {content}
        </g>
      );
    });
    return { content, height: maxHeight };
  }

  render() {
    const { width, height, globalState } = this.props;
    const { isAttentionLoading, selectedDrug, selectedDisease } = globalState;
    let cardWidth = width - 2 * this.margin - 2 * this.padding,
      cardHeight =
        height - 2 * this.padding - this.titleHeight - 2 * this.margin;

    const { content, height: graphHeight } = this.drawSubgraph();
    return (
      <Card
        size="small"
        title="Node Attention"
        style={{
          width: width - 2 * this.margin,
          height: height - 2 * this.margin,
          margin: this.margin,
        }}
        bodyStyle={{ padding: this.padding }}
        headStyle={{ height: this.titleHeight }}
      >
        <div
          className="nodelink"
          style={{ width: cardWidth, height: cardHeight, overflowY: 'scroll' }}
        >
          <svg
            width={cardWidth}
            height={Math.max(graphHeight, height)}
            className="nodeLink"
          >
            {isAttentionLoading ? (
              <g
                transform={`translate(${width / 2}, ${height / 2})`}
                textAnchor="middle"
              >
                {LOADING_ICON}
              </g>
            ) : selectedDisease && selectedDrug ? (
              content
            ) : (
              <text x={width / 2} y={height / 2} fill="gray">
                Please select drug and disease first
              </text>
            )}
          </svg>
        </div>
      </Card>
    );
  }
}

export default StateConsumer(NodeLink);
