"use server"

import { exec, spawn } from "child_process"

export type CheckUpdatesResponse = {
    current_hash: string,
    newest_hash: string,
    update_available: boolean
}

export async function CheckUpdates(): Promise<CheckUpdatesResponse> {
    const current_hash: string = await new Promise((resolve, reject) => {
        exec('git log -1 --format=%H', {
            cwd: process.cwd()
        }, (err, res) => {
            if(err)
                return reject(err);
            return resolve(res.trim());
        })
    });

    await new Promise((resolve, reject) => {
        exec('git fetch', {
            cwd: process.cwd()
        }, (err, res) => {
            if(err)
                return reject(err);
            return resolve(undefined);
        })
    });

    const newest_hash: string = await new Promise((resolve, reject) => {
        exec('git ls-remote https://github.com/ek-media/multicastgenerator HEAD', {
            cwd: process.cwd()
        }, (err, res) => {
            if(err)
                return reject(err);
            return resolve(res.replace('HEAD', '').trim());
        })
    });

    return {
        current_hash: current_hash.substring(0, 7),
        newest_hash: newest_hash.substring(0, 7),
        update_available: current_hash !== newest_hash
    }
}

export async function PerformUpdate() {
    const commands = [
        'git pull && yarn && yarn build && yarn prod:restart'
    ];

    
    console.log(`[Update] starting cwd: ${process.cwd()}`);

    await new Promise((resolve, reject) => {
        const proc = spawn('git pull && yarn && yarn build && yarn prod:restart', {
            cwd: process.cwd()
        });
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);
        proc.on('close', () => {
            return resolve(undefined);
        })
    })

    console.log(`[Update] finished`);
}