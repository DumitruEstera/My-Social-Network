import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';

export default function FollowerNetwork({ followerStats, loading }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [graphWidth, setGraphWidth] = useState(800);
  const [graphHeight, setGraphHeight] = useState(600);

  // Resize graph container based on window size
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setGraphWidth(container.clientWidth);
        setGraphHeight(Math.max(500, window.innerHeight * 0.6));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create and update the network graph
  useEffect(() => {
    if (loading || !followerStats || !svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Prepare data for D3
    const nodes = [];
    const links = [];
    
    // Process data into graph format
    if (followerStats.allUsers && followerStats.followRelationships) {
      // Create nodes from all users
      followerStats.allUsers.forEach(user => {
        nodes.push({
          id: user._id,
          username: user.username,
          email: user.email,
          followerCount: user.followerCount || 0,
          followingCount: user.followingCount || 0,
          profilePicture: user.profilePicture,
          isAdmin: user.isAdmin,
          blocked: user.blocked
        });
      });
      
      // Create links from follow relationships
      followerStats.followRelationships.forEach(relationship => {
        relationship.following.forEach(following => {
          links.push({
            source: relationship._id,
            target: following._id
          });
        });
      });
    }

    if (nodes.length === 0) return;

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", graphWidth)
      .attr("height", graphHeight)
      .attr("viewBox", [0, 0, graphWidth, graphHeight]);

    // Add zoom functionality
    const g = svg.append("g");
    
    svg.call(
      d3.zoom()
        .extent([[0, 0], [graphWidth, graphHeight]])
        .scaleExtent([0.25, 5])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

    // Create a tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "6px")
      .style("padding", "10px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
      .style("pointer-events", "none")
      .style("z-index", 1000);

    // Create the simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(graphWidth / 2, graphHeight / 2))
      .force("collision", d3.forceCollide().radius(d => getNodeRadius(d) + 5));

    // Add links
    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    // Add nodes
    const node = g.append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("mouseover", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseout", hideTooltip)
      .on("click", (event, d) => {
        setSelectedUser(d);
        event.stopPropagation();
      });

    // Add node circles
    node.append("circle")
      .attr("r", getNodeRadius)
      .attr("fill", getNodeColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add node labels for larger nodes
    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .text(d => d.followerCount > 0 ? d.username.substring(0, 8) : "")
      .attr("font-size", d => Math.min(2 * getNodeRadius(d) / 3, 12))
      .attr("fill", "#fff")
      .style("pointer-events", "none")
      .attr("opacity", d => d.followerCount > 2 ? 1 : 0);

    // Add arrow markers for links
    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#999")
      .attr("d", "M0,-5L10,0L0,5");

    // Add arrow to links
    link.attr("marker-end", "url(#arrow)");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Node radius function
    function getNodeRadius(d) {
      // Base size plus a factor based on follower count
      const baseSize = 7;
      const followerFactor = Math.sqrt(d.followerCount) * 2;
      return Math.max(baseSize, followerFactor);
    }

    // Node color function
    function getNodeColor(d) {
      if (d.isAdmin) return "#9333ea"; // Purple for admin
      if (d.blocked) return "#ef4444"; // Red for blocked
      return "#3b82f6"; // Blue for regular users
    }

    // Tooltip functions
    function showTooltip(event, d) {
      tooltip
        .html(`
          <div>
            <div class="font-bold">${d.username}</div>
            <div class="text-sm text-gray-600">${d.email}</div>
            <div class="mt-1">
              <span class="font-medium">${d.followerCount}</span> followers, 
              <span class="font-medium">${d.followingCount}</span> following
            </div>
            <div class="mt-1">
              ${d.isAdmin ? '<span class="text-purple-700 font-medium">Admin</span>' : 
                  d.blocked ? '<span class="text-red-600 font-medium">Blocked</span>' : 
                  '<span class="text-green-600 font-medium">Active</span>'}
            </div>
          </div>
        `)
        .style("visibility", "visible");
    }

    function moveTooltip(event) {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    }

    function hideTooltip() {
      tooltip.style("visibility", "hidden");
    }

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Hide user details when clicking outside
    svg.on("click", () => {
      setSelectedUser(null);
    });

    // Return cleanup function
    return () => {
      simulation.stop();
    };
  }, [followerStats, loading, graphWidth, graphHeight]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">User Follower Network</h2>
      <p className="text-gray-500 mb-4">
        Visualizing follow relationships between users. Larger nodes indicate more followers.
      </p>
      
      <div className="bg-gray-50 border rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm">Regular users</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
            <span className="text-sm">Admin users</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Blocked users</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          <p>
            <strong>Tip:</strong> Drag nodes to rearrange, scroll to zoom, click a node to see details.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4 relative">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : !followerStats ? (
            <div className="text-center py-12 text-gray-500">
              No follower data available.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white" style={{ height: graphHeight }}>
              <svg ref={svgRef} className="w-full h-full"></svg>
              <div ref={tooltipRef}></div>
            </div>
          )}
        </div>
        
        {selectedUser && (
          <div className="w-full md:w-1/4">
            <div className="bg-white border rounded-lg p-4 sticky top-4">
              <div className="flex items-center mb-3">
                <img 
                  src={selectedUser.profilePicture || "/default-avatar.jpg"}
                  alt={selectedUser.username}
                  className="w-12 h-12 rounded-full mr-3 object-cover"
                />
                <div>
                  <h3 className="font-bold">{selectedUser.username}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-blue-700">{selectedUser.followerCount}</div>
                  <div className="text-xs text-blue-600">Followers</div>
                </div>
                <div className="bg-green-50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-green-700">{selectedUser.followingCount}</div>
                  <div className="text-xs text-green-600">Following</div>
                </div>
              </div>
              
              <div className="mb-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedUser.isAdmin 
                    ? 'bg-purple-100 text-purple-800'
                    : selectedUser.blocked
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                }`}>
                  {selectedUser.isAdmin ? 'Admin' : selectedUser.blocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              
              <Link
                to={`/profile/${selectedUser.id}`}
                className="block w-full bg-indigo-600 text-white text-center py-2 rounded hover:bg-indigo-700"
              >
                View Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}