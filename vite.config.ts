import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/

export default defineConfig(({ command }) => {
	if (command === 'serve') {
        // dev specific config
		return {
            plugins: [react()],
            mode: 'development',
        }
    } else {
        // command === 'build'
        return {
            plugins: [react()],
            mode: 'production',
            // build specific config
        }
    }
})
