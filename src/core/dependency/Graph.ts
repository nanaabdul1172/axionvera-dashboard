/**
 * @module core/dependency/Graph
 *
 * A utility class for representing and manipulating directed graphs.
 * Supports cycle detection and topological sorting.
 */

export class Graph<T> {
  private adjacencyList: Map<T, Set<T>> = new Map();

  /**
   * Add a vertex to the graph.
   */
  addVertex(v: T): void {
    if (!this.adjacencyList.has(v)) {
      this.adjacencyList.set(v, new Set());
    }
  }

  /**
   * Add a directed edge from source to destination.
   */
  addEdge(source: T, destination: T): void {
    this.addVertex(source);
    this.addVertex(destination);
    this.adjacencyList.get(source)!.add(destination);
  }

  /**
   * Detect if the graph contains any cycles.
   * Uses Depth First Search (DFS).
   */
  hasCycle(): boolean {
    const visited = new Set<T>();
    const recStack = new Set<T>();

    for (const node of this.adjacencyList.keys()) {
      if (this.detectCycleDFS(node, visited, recStack)) {
        return true;
      }
    }

    return false;
  }

  private detectCycleDFS(
    node: T,
    visited: Set<T>,
    recStack: Set<T>
  ): boolean {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const neighbors = this.adjacencyList.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (this.detectCycleDFS(neighbor, visited, recStack)) {
          return true;
        }
      }
    }

    recStack.delete(node);
    return false;
  }

  /**
   * Perform a topological sort on the graph.
   * Returns an array of vertices in topological order.
   * Throws an error if a cycle is detected.
   */
  topologicalSort(): T[] {
    if (this.hasCycle()) {
      throw new Error("Circular dependency detected");
    }

    const visited = new Set<T>();
    const stack: T[] = [];

    for (const node of this.adjacencyList.keys()) {
      if (!visited.has(node)) {
        this.topologicalSortDFS(node, visited, stack);
      }
    }

    return stack.reverse();
  }

  private topologicalSortDFS(node: T, visited: Set<T>, stack: T[]): void {
    visited.add(node);

    const neighbors = this.adjacencyList.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          this.topologicalSortDFS(neighbor, visited, stack);
        }
      }
    }

    stack.push(node);
  }

  /**
   * Get all vertices in the graph.
   */
  getVertices(): T[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * Get neighbors of a vertex.
   */
  getNeighbors(v: T): T[] {
    const neighbors = this.adjacencyList.get(v);
    return neighbors ? Array.from(neighbors) : [];
  }
}
