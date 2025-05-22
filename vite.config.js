import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // or vue or other

export default defineConfig({
  plugins: [react()],
});
