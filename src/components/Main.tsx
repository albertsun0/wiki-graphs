import React, { useEffect, useState } from "react";
import { fetchRelatedPages, fetchPage } from "./fetch";
import { ForceGraph2D } from "react-force-graph";
import Loading from "./Loading";

enum LinkColor {
  Default = "rgba(255, 255, 255, 0.2)",
  Hover = "rgba(255, 255, 255, 0.8)",
}

type Node = {
  title: string;
  description: string;
  normalizedTitle: string;
  id: string;
  visited: boolean;
};

type Link = {
  source: string;
  target: string;
  value: number;
};

type DataType = {
  nodes: Node[];
  links: Link[];
};

type hoverType = {
  title: string;
  description: string;
};

function Main() {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [links, setLinks] = React.useState<Link[]>([]);
  const [data, setData] = useState<DataType>({ nodes: [], links: [] });
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverDescription, setHoverDescription] = useState<hoverType | null>(
    null
  );

  const [query, setQuery] = useState<string>("Random Forests");
  const [loading, setLoading] = useState<boolean>(false);
  // Create link between origin and traget with origin lexographically smaller
  const createLink = (origin: string, target: string): Link => {
    if (target < origin) {
      [origin, target] = [target, origin];
    }
    return {
      source: origin,
      target: target,
      value: 1,
    };
  };
  // Nodes get mutated by force graph, input passed in is not actual Node type
  const handleClick = (node: Node) => {
    updateGraph(node.id);
  };
  // Rip types
  const nodeHover = (node: any) => {
    const _highlightLinks = new Set();
    if (node) {
      setHoverDescription({
        title: node.normalizedTitle,
        description: node.description,
      });
      links.forEach((link: any) => {
        if (link.source === node.id || link.target === node.id) {
          _highlightLinks.add(link.source + link.target);
        }
      });
    } else {
      setHoverDescription(null);
    }
    console.log(_highlightLinks);
    setHighlightLinks(_highlightLinks);
  };

  const updateGraph = async (
    origin: string,
    initialNodes: Node[] = nodes,
    initialLinks: Link[] = links
  ) => {
    setLoading(true);
    await fetchRelatedPages(origin)
      .then((response) => {
        const currentNodes = new Set(initialNodes.map((node) => node.id));
        let newNodes = [...initialNodes];
        let newLinks = [...initialLinks];
        response.forEach((page) => {
          if (!currentNodes.has(page.id)) {
            newNodes.push(page);
            newLinks.push(createLink(origin, page.id));
          } else {
            let o = origin;
            let d = page.id;
            if (d < o) {
              [o, d] = [d, o];
            }
            let found = false;
            for (let i = 0; i < newLinks.length; i++) {
              console.log(newLinks[i].source, newLinks[i].target);
              if (newLinks[i].source === o && newLinks[i].target === d) {
                newLinks[i].value++;
                found = true;
                break;
              }
            }
            if (!found) {
              newLinks.push(createLink(o, d));
            }
          }
        });
        console.log(newNodes, newLinks);
        setNodes(newNodes);
        setLinks(newLinks);
        // data gets mutated by library
        setData({
          nodes: structuredClone(newNodes),
          links: structuredClone(newLinks),
        });
      })
      .finally(() => {
        setLoading(false);
      });
    // there needs to be a link from origin to each node in response
  };
  const resetGraph = (query: string) => {
    fetchPage(query).then((data) => {
      updateGraph(data.id, [data], []);
    });
  };

  const addQuery = (query: string) => {
    setLoading(true);
    fetchPage(query)
      .then((data) => {
        const currentNodes = new Set(nodes.map((node) => node.id));
        if (!currentNodes.has(data.id)) {
          updateGraph(data.id, [...nodes, data]);
        }
      })
      .catch((e) => {
        alert("Query failed, please try again: " + e);
      });
  };

  const reset = () => {
    setNodes([]);
    setLinks([]);
    setData({ nodes: [], links: [] });
  };

  useEffect(() => {
    resetGraph("Random Forests");
  }, []);

  return (
    <div>
      <ForceGraph2D
        nodeRelSize={6}
        graphData={data}
        onNodeClick={handleClick}
        linkWidth={(d) => d.value}
        linkColor={(link: any) => {
          //Rip types again
          return highlightLinks.has(link.source.id + link.target.id)
            ? LinkColor.Hover
            : LinkColor.Default;
        }}
        onNodeHover={(n) => nodeHover(n!)}
        // Node and Label
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.normalizedTitle;
          const fontSize = 10 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(
            (n) => n + fontSize * 0.2
          );
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 0.5, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = node.color;
          ctx.fillText(label, node.x!, node.y! + 1.2);

          node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
        }}
      />
      <div className="absolute left-0 top-0 w-1/4 p-4 flex flex-col space-y-2 text-gray-300 text-sm">
        <input
          type="text"
          className="w-full bg-[#262626] border border-gray-700 px-4 py-2 rounded-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addQuery(query);
            }
          }}
        />
        <div className="bg-[#262626] border border-gray-700 px-4 py-2 rounded-sm">
          <div>Nodes {nodes.length}</div>
          <div>Links {links.length}</div>
        </div>
        <div
          className={`bg-[#262626] border border-gray-700 px-4 py-2 rounded-sm space-y-2 transition-all duration-200 ${
            hoverDescription
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-5"
          }`}
        >
          <div className="font-bold">
            {hoverDescription && hoverDescription.title}
          </div>
          {hoverDescription && hoverDescription.description && (
            <div>{hoverDescription.description}</div>
          )}
        </div>
      </div>
      {loading && (
        <div className="absolute right-0 top-0 p-4">
          <Loading />
        </div>
      )}
      <div className="absolute left-0 bottom-0 p-4 flex flex-col space-y-2 text-gray-300 text-sm">
        <div
          className="bg-[#262626] border border-gray-700 px-4 py-2 rounded-sm hover:cursor-pointer"
          onClick={reset}
        >
          Reset
        </div>
      </div>
    </div>
  );
}

export default Main;
