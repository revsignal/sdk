const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const watch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2015'],
  outfile: 'dist/agent.js',
  format: 'iife',
  globalName: 'Agent',
};

async function build() {
  try {
    await esbuild.build(config);
    
    // Post-process the built file to ensure Agent is properly exported
    const distPath = path.join(__dirname, 'dist/agent.js');
    let content = fs.readFileSync(distPath, 'utf-8');
    
    // The IIFE returns the module wrapper, we need to make sure window.Agent is set
    // and that the global Agent variable is the correct object
    // Check if the assignment to window.Agent is there
    if (content.includes('window.Agent=')) {
      console.log('✅ SDK built successfully with window.Agent assignment');
    } else {
      console.warn('⚠️  Warning: window.Agent assignment not found');
    }
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function watchBuild() {
  try {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('✅ SDK built successfully');
    console.log('👀 Watching for changes...');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

if (watch) {
  watchBuild();
} else {
  build();
}

