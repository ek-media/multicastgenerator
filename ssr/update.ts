"use server"

import { exec, spawn } from "child_process"
import { join } from "path";

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
        `chmod +x ${join(process.cwd(), 'update.sh')}`,
        `./${join(process.cwd(), 'update.sh')}`
    ];
    
    console.log(`[Update] starting cwd: ${process.cwd()}`);

    for(const command of commands)
        await new Promise((resolve, reject) => {
            exec(command, (err, res) => err ? reject(err) : resolve(res))
        })

    console.log(`[Update] finished`);
}