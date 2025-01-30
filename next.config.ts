import { exec } from "child_process";
import type { NextConfig } from "next";

const current_hash: string = await new Promise((resolve, reject) => {
    exec('git log -1 --format=%H', {
        cwd: process.cwd()
    }, (err, res) => {
        if(err)
            return reject(err);
        return resolve(res.trim());
    })
});

const nextConfig: NextConfig = {
  env: {
    current_hash
  }
};

export default nextConfig;
