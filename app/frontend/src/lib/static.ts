'use server'

export async function publicEnv() {
    return {
        BACKEND_URL: process.env.BACKEND_URL || '',
        WEBSOCKET_SERVER: process.env.WEBSOCKET_SERVER || ''
    }
}