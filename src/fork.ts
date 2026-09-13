/** Output this fork switches off by default; each flag restores the upstream behaviour. */
export function savingsFooterEnabled(): boolean {
  return process.env.GRAFT_FORK_SAVINGS_FOOTER === '1';
}

export function mcpSteeringEnabled(): boolean {
  return process.env.GRAFT_FORK_MCP_STEERING === '1';
}
