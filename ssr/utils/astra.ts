"use server"

import axios from "axios"

type AstraRequestProps = {
    path: string,
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    query?: Record<string, any>,
    body?: any
}

export async function AstraRequest({ path, method = 'GET', query, body }: AstraRequestProps) {
    const res = await axios.request({
        url: `${process.env.ASTRA_HOST || 'http://127.0.0.1:9091'}${path.startsWith('/') ? path : `/${path}`}`,
        params: query,
        data: body,
        method,
        auth: {
            username: process.env.ASTRA_USER || 'ek-media',
            password: process.env.ASTRA_PASS as string
        }
    });
    return res.data;
}