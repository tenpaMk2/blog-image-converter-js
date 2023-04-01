/**
 * @file The Node.js script to convert and resize image for blog.
 */

import path from "path";
import fs from "fs";
import imageSize from "image-size";
import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";
import parser from "./lib/argument-parser.mjs";

// parse arguments
const options = parser.parse(process.argv);
const imageminWebpConfig = { size: options.targetSize, metadata: "exif" };

// main
const isImagePath = (path) =>
  /.*\.(jpg|jpeg|png|tif|tiff)$/.test(path.toLowerCase());

const getImagePaths = (imageDirPath) => {
  const resolvedPath = path.resolve(imageDirPath);
  const anyFiles = fs.readdirSync(resolvedPath);
  const imageFiles = anyFiles.filter(isImagePath);
  return imageFiles.map((imageFile) => path.resolve(imageDirPath, imageFile));
};

const isLandscapeImage = (imagePath) => {
  const dimensions = imageSize(imagePath);
  return dimensions.width > dimensions.height;
};

const main = async () => {
  const imagePaths = getImagePaths(options.input);
  let promises = [];

  const landscapePaths = imagePaths.filter((path) => isLandscapeImage(path));
  const landscapeConfig = Object.assign({}, imageminWebpConfig, {
    resize: { width: options.maxLength, height: 0 },
  });
  promises.push(
    imagemin(landscapePaths, {
      destination: options.output,
      plugins: [imageminWebp(landscapeConfig)],
    })
  );

  const portlaitPaths = imagePaths.filter((path) => !isLandscapeImage(path));
  const portlaitConfig = Object.assign({}, imageminWebpConfig, {
    resize: { width: 0, height: options.maxLength },
  });
  promises.push(
    imagemin(portlaitPaths, {
      destination: options.output,
      plugins: [imageminWebp(portlaitConfig)],
    })
  );

  Promise.all(promises).then((val) => {
    const results = [...val[0], ...val[1]];
    results.forEach((result) =>
      console.log(`done!!: ${result.destinationPath}`)
    );
  });
};

await main();
