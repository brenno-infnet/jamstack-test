import shell from 'shelljs';
import appConfig from './app.json'
import fs from 'fs/promises'


(async function build(){

    console.log('Start build process...');

    shell.rm('-rf', 'public');
    shell.mkdir('public')

    const htmlFile = await (await fs.readFile('index.html'))
        .toString()
        .replace('$TITLE', appConfig.title)
        .replace('$DESCRIPTION', appConfig.description)
        .replace('$CONTENT', appConfig.title);
    
    await fs.writeFile('public/index.html', htmlFile);
    console.log('Success!!!');
})();