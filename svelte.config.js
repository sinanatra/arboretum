import adapter from "@sveltejs/adapter-static";
const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      base: dev ? "" : process.env.BASE_PATH,
    },
    alias: {
      "@components": "src/lib/components",
      "@stores": "src/lib/stores",
      "@lib": "src/lib",
    },
  },
};

export default config;
