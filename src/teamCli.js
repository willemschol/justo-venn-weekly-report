import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function getTeamCliEnv() {
  return {
    ...process.env,
    JUSTO_TEAM_CLI_INTERACTIVE: "false",
    NODE_OPTIONS: "",
  };
}

export async function runTeamCliJson(args) {
  const { stdout } = await execFileAsync(
    "npx",
    ["@getjusto/team-cli", ...args, "--format", "json"],
    {
      env: getTeamCliEnv(),
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout);
}
