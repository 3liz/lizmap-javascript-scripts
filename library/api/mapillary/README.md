# Mapillary

https://user-images.githubusercontent.com/2145040/199705616-0cf3c8c4-24bc-4149-b85d-17b940d0592f.mp4

## Requirements

- Lizmap Web Client 3.5.6 or 3.6.X
- Your map projection must be `ESPG:3857`

## Production

To use Mapillary in Lizmap:
1. copy `mapillary.js` and `mapillary_token.js` from `./dist` directory to the `media/js` directory of your project
2. edit `mapillary_token.js` then replace `YOUR_MAPILLARY_TOKEN_HERE` with your mapillary access token

## For developpers

Install dependencies with `npm install`.

You can modify source code and:
- build it when developping with `npm run watch` (Webpack detects code modifications then builds)
- build it for production with `npm run build`
