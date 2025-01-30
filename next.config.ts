import { execSync } from "child_process";
import type { NextConfig } from "next";

const current_hash: string = execSync('git log -1 --format=%H', {
  cwd: process.cwd()
}).toString().trim();

const nextConfig: NextConfig = {
  env: {
    current_hash
  }
};

export default nextConfig;
