import shell from 'shelljs';
import appConfig from './app.json';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { faker } from '@faker-js/faker';
import { https } from 'follow-redirects';
import sharp from 'sharp';

function generateImages(amount : number = 5) {
    return Array.from({ length: amount }, () => faker.image.cats());
}

async function processImage(url: string, imagePath: string, thumbnailPath: string){
    
    const imageStream = createWriteStream(imagePath);
    const thumbnailStream = createWriteStream(thumbnailPath)

    https.get(url, request => {
        request.pipe(imageStream)

        const sharpInstance = sharp();
        sharpInstance.resize(200,200, {
            fit: sharp.fit.cover
        }).pipe(thumbnailStream)

        imageStream.on('finish', () => {
            imageStream.close();
        })

        request.pipe(sharpInstance);


        thumbnailStream.on('finish', () => {
            thumbnailStream.close();
        })
    })
}

(async function build(){

    console.log(generateImages(10));
    
    console.log('Start build process...');

    shell.rm('-rf', 'public');
    shell.mkdir('public');
    shell.mkdir(path.join('public', 'images'));
    shell.mkdir(path.join('public', 'thumbnails'));

    console.log('Download images...');
    
    const imagesUrls = generateImages(10);
    await Promise.all(
        imagesUrls.map((imagesUrl, index) => 
            processImage(
                imagesUrl,
                path.join('public', 'images', `${index}.jpg`), 
                path.join('public', 'thumbnails', `${index}.jpg`)
            )
        )
    );

    const imagesContent = imagesUrls.map((_, index) => `
        <a href='/jamstack-test/images/${index}.jpg'>
            <img src="/jamstack-test/thumbnails/${index}.jpg">
        </a>
    `).join('');

    const imagesGrid = `
        <div class='images-grid'>
                ${imagesContent}
        </div>
    `



    const htmlFile = await (await fs.readFile('index.html'))
        .toString()
        .replace('$TITLE', appConfig.title)
        .replace('$DESCRIPTION', appConfig.description)
        .replace('$CONTENT', imagesContent);
    
    await fs.writeFile('public/index.html', htmlFile);
    console.log('Success!!!');
})();