import React, { useEffect, useState, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { IState } from 'types';

interface Props {
  width: number;
  height: number;
  globalState: IState; // Contains graphData
}

const SourceGraph: React.FC<Props> = ({ width, height, globalState }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { graphData } = globalState; // Extract graphData from globalState
  const { isGraphLoading } = globalState; // Extract graphData from globalState
  const { nodeNameDict } = globalState;

  useEffect(() => {
    if (containerRef.current && graphData) {
      const updatedNodes = graphData.nodes.map((node: any) => {
        let label = node.label === '' ? node.id : node.label;
        const nodeType = node.type as keyof typeof nodeNameDict;

        // If the type exists in the dictionary and node.id exists in that category, set the label
        if (
          nodeType &&
          nodeNameDict[nodeType] &&
          nodeNameDict[nodeType][node.id]
        ) {
          label = nodeNameDict[nodeType][node.id]; // Map node ID to name based on its type
        }

        return { ...node, label };
      });

      const updatedGraphData = {
        ...graphData,
        nodes: updatedNodes,
      };
      const options = {
        nodes: {
          shape: 'dot',
          font: {
            size: 10,
            align: 'center',
            multi: false,
          },
          borderWidth: 1,
        },
        edges: {
          width: 2,
          color: {
            inherit: true,
            opacity: 0.3,
          },
          smooth: {
            enabled: true,
            type: 'continuous',
            roundness: 0.5, //,
          },
        },
        physics: {
          enabled: false,
        },
        layout: {
          improvedLayout: false,
        },
        manipulation: {
          enabled: true,
        },
        interaction: {
          hover: true, // Enable hover interaction
        },
      };

      const network = new Network(
        containerRef.current,
        updatedGraphData,
        options
      );

      network.on('click', (params) => {
        console.log('Clicked on ', params);
      });
    }
  }, [graphData]);

  return (
    // <div
    //   ref={containerRef}
    //   style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
    // />

    <div>
      {isGraphLoading ? (
        <div className="loading-spinner">Loading graph data...</div>
      ) : (
        <div
          ref={containerRef}
          style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
        />
      )}
    </div>
  );
};

export default SourceGraph;
