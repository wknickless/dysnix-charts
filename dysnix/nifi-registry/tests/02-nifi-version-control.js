const puppeteer = require ('puppeteer-core')
const expect = require('chai').expect

describe('Put NiFi Process Group Under Version Control', () => {
    let browser
    let page

    before(async () => {
        browser = await puppeteer.connect({
          browserWSEndpoint: 'ws://'+process.env.K8SNODEIP+':'+process.env.K8SPORT,
          ignoreHTTPSErrors: true
        })
        page = await browser.newPage()
    })

    it('NiFi redirects to KeyCloak login page', async () => {
        let gotoSucceeded = false
        for ( let i = 0; ( i < 60 ) && ( ! gotoSucceeded ); i++ ) {
            try {
                await Promise.all([
                    page.goto(process.env.NIFIURL),
                    page.waitForNavigation(),
                    page.waitForNetworkIdle()
                ])
                gotoSucceeded = true
            }
            catch(err) {
                console.log("        Connection to "+process.env.NIFIURL+"failed: "+err.message+" ( try "+i.toString()+")")
                await page.waitForTimeout(5000)
            }
        }
        const pageTitle = await page.waitForSelector('h1[id="kc-page-title"]')
        const titleContent = await pageTitle.evaluate(el => el.textContent)
        expect(titleContent).to.include('Sign in to your account')
    }).timeout(30000)

    it('Get screenshot of Keycloak login page', async () => {
        await page.screenshot({
            path: process.env.HOME+"/screenshots/01-keycloak-redirect.png",
            fullPage: true
        })
    })

    it('nifi@example.com shown as logged in user', async () => {
        await page.type('input[id="username"]','nifi')
        await page.type('input[id="password"]','reallychangeme')
        await Promise.all([
            page.click('input[id="kc-login"]'),
            page.waitForNavigation(),
            page.waitForNetworkIdle()
        ])
        let messageContentSelector = await page.waitForSelector('div[id="message-content"]')
        let messageContent = await messageContentSelector.evaluate(el => el.textContent)
        // loop 30 times unless messageContent is empty
        for (let i = 0; ( i < 30 ) && ( messageContent != "" ); i++ ) {
            await Promise.all([
                page.reload(),
                page.waitForNavigation(),
                page.waitForNetworkIdle(),
                page.waitForTimeout(5000)
            ])
            console.log("        Message Content: "+messageContent+" ( try "+i.toString()+")")
            messageContentSelector = await page.waitForSelector('div[id="message-content"]')
            messageContent = await messageContentSelector.evaluate(el => el.textContent)
            if ( messageContent != "") {
                console.log("        Message Content: "+messageContent)
            }
        }
        const currentUserElement = await page.waitForSelector('div[id="current-user"]')
        const userName = await currentUserElement.evaluate(el => el.textContent)
        expect(userName).to.equal('nifi@example.com')
    }).timeout(300000)

    it('Get screenshot of logged in user', async () => {
        await page.screenshot({
            path: process.env.HOME+"/screenshots/02-logged-in-user.png",
            fullPage: true
        })
    })

    it('Open Process Group Context Menu', async() => {
        await page.click('g[id="id-81055991-0180-1000-0000-00000212b56a"]', { button: 'right'})
        await page.waitForNetworkIdle()
    })

    it('Get screenshot of context menu', async () => {
        await page.screenshot({
            path: process.env.HOME+"/screenshots/04-context-menu.png",
            fullPage: true
        })
    })

    it('Hover over Version Menu Item', async() => {
        await page.hover('div[id="version-menu-item"]')
        await page.waitForNetworkIdle()
    })

    it('Get screenshot of version menu item', async () => {
        await page.screenshot({
            path: process.env.HOME+"/screenshots/05-version-menu-item.png",
            fullPage: true
        })
    })

    it('Click on Version Control Menu Item', async() => {
        await page.click('div[id="start-version-control-menu-item"]')
        await page.waitForNetworkIdle()
    })

    it('Get screenshot of Save Flow Version', async () => {
        await page.screenshot({
            path: process.env.HOME+"/screenshots/06-save-flow-version.png",
            fullPage: true
        })
    })

    it('Fill in Save Flow Version Dialog', async() => {
        await Promise.all([
            await page.type('input[id="save-flow-version-name-field"','bar'),
            await page.type('textarea[id="save-flow-version-description-field"]','none, or at least not much')
        ])
    })

    it('Get screenshot of Filled In Save Flow Version', async () => {
        await page.screenshot({
            path: process.env.HOME+"/screenshots/07-filled-save-flow-version.png",
            fullPage: true
        })
    })

    it('Click on Save Button', async() => {
        const dialog = await page.waitForSelector('div[id="save-flow-version-dialog"]')
        const buttonList = await dialog.$x('//button[contains(.,"Save")]')
        await buttonList[0].click()
        await page.waitForNetworkIdle()
    })

    it('Get screenshot after Save Clicked', async () => {
        await page.screenshot({
            path: process.env.HOME+"/screenshots/08-post-save-flow-version.png",
            fullPage: true
        })
    })

    after(async () => {
        await browser.close()
    })
})
