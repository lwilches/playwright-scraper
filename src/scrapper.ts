import { promises } from 'dns';
import { copyFileSync } from 'fs';
import { url } from 'inspector';
import * as playwright  from  'playwright';
import * as fs from 'fs';


async function generateglosarioFasecolda() {
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://fasecolda.com/servicios/glosario');
      // Realizar operaciones de scraping
    const title = await page.title();
    console.log('Título de la página:', title);
    await page.screenshot( { path:"files/home.png"} );
    

    let menu = await page.$('[class*="menu"][id="menu-glosario"]')
    if (menu ){
        let itemsMenu = await menu.$$("li");
        

        let arryAbc =await  Promise.all( itemsMenu.map( async  (item)=> {
            let  link =  await item.$('a');
            let titulo = await item.innerText();
            return  {
                titulo : titulo ,
                link :  await link?.getAttribute("href")
            };
        }));
        
        

        for( const item  of   arryAbc )
        {
            let url= item.link?.toString()??"";
            if (url == "") continue;
            await page.goto(url);
            let titulo = item.titulo;
            let  tituloPage  =  await page.title()   
            console.info( `Titulo ${tituloPage } opcion ${item.titulo } url: ${item.link}` )     ;
            let divContenido = (await   page.$$('div.fl-rich-text')).at(-1);
            let parrafos = await  divContenido?.$$('p'); 
            if (!parrafos) continue;
            let newParrafos = await  Promise.all( parrafos.map( async  (c)=> {
                let text = await c.innerText();
                let  strongElement = await c.$('strong');
                let  tituloStrong = strongElement ? await strongElement.innerText() : ''
                let descripcion = text.replace(tituloStrong , '').trim()    
                tituloStrong = tituloStrong.replace( ":", "").trim()
                fs.appendFileSync('files/glosario.csv', `"${tituloStrong}","${descripcion}"\n`  , 'utf-8'  ); 
                return {
                    titulo :tituloStrong ,
                    descripcion :descripcion 
                }     
            }) ) ;  
            console.log (newParrafos );

        }
    }
   
    await browser.close();
}

fs.openSync('files/glosario.csv', 'w');
generateglosarioFasecolda().catch((error) =>  console.error('Error durante el scraping:', error));
fs.closeSync(fs.openSync('files/glosario.csv', 'w'))
console.log('Archivo files/glosario.csv cerrado');

