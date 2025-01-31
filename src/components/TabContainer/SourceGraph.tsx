import React, { useEffect, useState, useRef, createContext } from 'react';
import { Network } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';
import {  IState } from 'types';

interface Props {
  height: number;
  width: number;
  globalState: IState;
}

interface State {}

interface INode extends d3.SimulationNodeDatum {
  id: string; // `${node_type}:${node_id}`
  nodeId: string; //
  nodeType: string; //
  fx?: number;
  fy?: number;
}

interface ILink {
  source: string;
  target: string;
  score: number;
  edgeInfo: string;
}



const SourceGraph: React.FC = () => {
  // Access the global state
  const { nodeNameDict, edgeTypes, selectedPathNodes } =
      this.props.globalState;

  const [graphDataNet, setGraphData] = useState<{
    nodes: any[];
    edges: any[];
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Function to adjust node positions based on window size
    const adjustNodePositions = (nodes: any[]) => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      return nodes.map((node: any) => ({
        ...node,
        x: node.x * (windowWidth / 1000), // Scale based on window width (adjust 1000 as needed)
        y: node.y * (windowHeight / 1000), // Scale based on window height (adjust 1000 as needed)
      }));
    };

    // Fetch the graph.json file (simulating with static data here)
    const fetchGraphData = async () => {
      try {
        const response = await fetch('/graph.json'); // Make sure graph.json is available at this path
        if (response.ok) {
          const data = await response.json();

          // Adjust nodes' x and y positions based on window size
          const adjustedNodes = adjustNodePositions(graphData.nodes);

          // Transform edges to match vis-network format
          const transformedEdges = graphData.edges.map((edge: any) => ({
            from: edge.source,
            to: edge.target,
            width: 2, // Set edge width or modify it based on edge data
            color: { inherit: false, opacity: 0.3 },
            smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
          }));

          // Set the graph data with nodes and edges
          setGraphData({
            nodes: adjustedNodes,
            edges: transformedEdges,
          });
        } else {
          console.error('Failed to load graph.json');
        }
      } catch (error) {
        console.error('Error loading graph.json', error);
      }
    };

    fetchGraphData();
  }, []); // Empty dependency array ensures the effect runs once on component mount

  useEffect(() => {
    if (containerRef.current && graphDataNet) {
      const options = {
        nodes: {
          shape: 'dot',
          font: {
            size: 30,
            align: 'center', // Center align the label inside the node
            multi: false,
          },
          borderWidth: 1,
        },
        edges: {
          width: 2,
          color: {
            inherit: true,
          },
          smooth: {
            enabled: true, // Ensure smooth is enabled
            type: 'continuous', // Use 'continuous' for smooth type
            roundness: 0.1, // Set roundness (a number between 0 and 1)
          },
        },
        physics: {
          enabled: false, // Disable physics for fixed node positions
        },
        layout: {
          improvedLayout: false,
        },
        manipulation: {
          enabled: true,
        },
      };

      const network = new Network(containerRef.current, graphDataNet, options);

      network.on('click', function (params) {
        console.log('Clicked on ', params);
      });
    }
  }, [graphDataNet]); // This effect will re-run whenever graphData is updated

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
    />
  );
};

export default SourceGraph;
