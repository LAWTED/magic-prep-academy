if(!self.define){let e,s={};const a=(a,t)=>(a=new URL(a+".js",t).href,s[a]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=s,document.head.appendChild(e)}else e=a,importScripts(a),s()})).then((()=>{let e=s[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e})));self.define=(t,n)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(s[c])return;let i={};const r=e=>a(e,c),o={module:{uri:c},exports:i,require:r};s[c]=Promise.all(t.map((e=>o[e]||r(e)))).then((e=>(n(...e),i)))}}define(["./workbox-4754cb34"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"3de7d47423f72a830661791214ec4322"},{url:"/_next/static/Hv27Dc43XzlWhN7ZNBg65/_buildManifest.js",revision:"78eb867aaa43261864273dc4297c5087"},{url:"/_next/static/Hv27Dc43XzlWhN7ZNBg65/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/14-ed7c1fe6b9f03002.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/212-a7f06154ddbe474f.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/294.e72d2554be082393.js",revision:"e72d2554be082393"},{url:"/_next/static/chunks/4bd1b696-f6088ba23f86ddc8.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/57-407747af98760cc4.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/63-a983ce4ec6b64099.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/684-e25a813bdcbaff45.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/874-aa736719318a0c9e.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/915-344fa6a39faea131.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/932-10838a89e5c131d3.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(auth-pages)/auth/callback/route-277605b792cfd435.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(auth-pages)/forgot-password/page-051a9abaa27b14b7.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(auth-pages)/layout-9855178eed69fc45.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(auth-pages)/sign-in/page-4f30ff1829fc10bd.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(auth-pages)/sign-up/page-dea120567887f495.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(students)/homepage/page-0c805f833961abd5.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(students)/homepage/reset-password/page-6627ae7ced997401.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(students)/module/%5Bid%5D/page-b364e55a0e441909.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(students)/onboarding/page-4da7f4679e35768c.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/(students)/session/%5Bid%5D/page-3d788ad63fd735c4.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/_not-found/page-9547ff91a8e93ee4.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/api/chat/route-7d119aa824dbbf7b.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/api/materials/route-ae6bb14117308b09.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/chat/page-7bb6e9eba41993b8.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/layout-25917c3088588f03.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/mentor/dashboard/page-f9f9ea2e0770d588.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/mentor/materials/process/page-fe095fc6e8c08984.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/mentor/materials/upload/page-19b64cbab14f3871.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/mentor/onboarding/page-8e23ea61cd97d3b7.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/mentor/sign-in/page-d109f6948d3eb13a.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/app/page-a1e4a8ffa3c5afd0.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/framework-859199dea06580b0.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/main-app-80a382d8ecce8301.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/main-ef55eaf426fcadf8.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/pages/_app-da15c11dea942c36.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/pages/_error-cc3f077a18ea1793.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-d1a5ce34b2dcd0fb.js",revision:"Hv27Dc43XzlWhN7ZNBg65"},{url:"/_next/static/css/0d0eeb9a90ec6ec0.css",revision:"0d0eeb9a90ec6ec0"},{url:"/_next/static/media/569ce4b8f30dc480-s.p.woff2",revision:"ef6cefb32024deac234e82f932a95cbd"},{url:"/_next/static/media/ba015fad6dcf6784-s.woff2",revision:"8ea4f719af3312a055caf09f34c89a77"},{url:"/images/avatars/Carrot.png",revision:"c04a7be55f688afb58a23c393e449b67"},{url:"/images/avatars/Lou.png",revision:"554f47229237d3e894584cb96588feff"},{url:"/images/avatars/Nemo.png",revision:"4bce48dcc3e4dc724799353921b88b7f"},{url:"/images/avatars/Otta.png",revision:"c9cac4da647841e4d8a35e858e7b6539"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:a,state:t})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
