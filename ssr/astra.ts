"use server"

import { AstraRequest } from "./utils/astra"

export type AstraStream = {
    name: string,
    enable: boolean,
    id: string,
    output?: string,
    stats?: {
        audio_count: number,
        video_count: number,
        bitrate: number,
        cc_error: number,
        pes_error: number,
        sc_error: number,
        sessions: number,
        sync_error: number
    }
}

export async function GetAstraStreams(): Promise<AstraStream[]> {
    const res = await AstraRequest({
        path: '/api/stream-info'
    });
    const streams: Array<Omit<AstraStream, 'stats'>> = res.streams.map((stream: any) => {
        const outputFilter = (stream.output || []);
        return {
            id: stream.id,
            name: stream.name,
            enable: stream.enable,
            output: outputFilter.length !== 0 ? outputFilter[0] : undefined
        }
    });
    const stats = await Promise.all(streams.filter(item => item.enable).map(async (stream) => {
        const status = await AstraRequest({
            path: `/api/stream-status/${stream.id}`,
            query: {
                t: 0
            }
        });
        return {
            id: stream.id,
            audio_count: status.audio_count,
            bitrate: status.bitrate,
            cc_error: status.cc_error,
            pes_error: status.pes_error,
            sc_error: status.sc_error,
            sessions: status.sessions,
            sync_error: status.sync_error,
            video_count: status.video_count
        } as AstraStream['stats'] & { id: string }
    }))
    return streams.map(stream => {
        const statsFilter = stats.filter(item => item.id === stream.id);
        return {
            ...stream,
            stats: (statsFilter.length === 0) ? undefined : statsFilter[0]
        }
    })
}

export async function ToggleAstraStream(id: string): Promise<void> {
    await AstraRequest({
        path: '/control/',
        method: 'POST',
        body: {
            cmd: 'toggle-stream',
            id
        }
    });
}