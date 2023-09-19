

async function main() {

    const DEBUG_API = 'https://www.listasin.net/api/debug-logging.cgi?asins=';
    const KS_JD_API = 'https://www.listasin.net/api/0199_jd.cgi?asins=';
    const asinatsu_sleep = ms => new Promise(res => setTimeout(res, ms));

    //
    // Kindle ASIN page
    //
    if (document.getElementById('ASIN')) {
        console.log("kiseppe: here is Kindle ASIN Page");
        const asin = document.getElementById('ASIN').value;
        if (asin.match(/^B[0-9A-Z]{9}$/m)) {
            // call kiseppe 1.0
	    // (kiseppe1.0::main() => asin_page_main())
            asin_page_main();

	    // コレクション API を呼び出す
            let c = document.querySelector("a[href*='binding=kindle_edition']");
            if (! c) return;
	    if (/🉐/.test(c.innerHTML)) return;
            let r = c.getAttribute('href').match(/(B0[0-9A-Z]{8})/);
            let collection_asin = r[0];
            //// build API url and access
            const url = `${KS_JD_API}COL_${collection_asin},${asin}`;
	    console.log(url);

            await fetch(url).then(r => r.json()).then(res => {
		console.log(res['result']['series']);
		const sd = res['result']['series'][collection_asin];
                //// 実質割引率 15% 以上のもののみ処理を行う
                if (! sd || Number(sd) < 15 ) return;
		//c.style.backgroundColor = '#FFE8E8';
		if (! /🉐/.test(c.innerHTML))
		    c.innerHTML += '<span style="font-size: xx-small; background-color: #FFE8E8">🉐シリーズにセール作品あり</span>';
	    });

            return;
        }
    }

    //
    // is Kindle Matomegai Page?
    //
    // data-collection-asin="B0B3TFK9YX" 
    // data-ajax-url="...B074V5W2R7,B074V3V9W5,B074V5W5GT"
    if (document.querySelector('[data-collection-asin]')) {
        console.log("kiseppe: here is Kindle Matomegai Page");

        let collection_asin =
	    document.querySelector('[data-collection-asin]').
	    getAttribute('data-collection-asin');
	if (! collection_asin) return;
        let aset = new Set();
        document.querySelectorAll('[data-ajax-url]').forEach(e => {
	    const u = e.getAttribute('data-ajax-url');
            console.log(u);
            const r = u.match(/(B0[0-9A-Z]{8})/g);
            r.forEach(s => aset.add(s));
        });
        let asins = Array.from(aset);

        //// build API url and access
	// コレクション API を呼び出す
        const url = `${KS_JD_API}COL_${collection_asin},${asins}`;
	console.log(url);
        try {
            await fetch(url).then(r => r.json()).then(res => {
		console.log(res['result']['series']);
		const sd = res['result']['series'][collection_asin];
                //// 実質割引率 15% 以上のもののみ処理を行う
                if (! sd || Number(sd) < 15) return;
		let c = document.getElementById('collection-masthead__title').parentNode;
		if (/🉐/.test(c.innerHTML)) return;
                let jh = document.createElement('span');
		jh.style.backgroundColor = "#FFE8E8";
                jh.innerHTML = '🉐シリーズにセール作品あり';
		c.appendChild(jh);
	    });
        } catch (error) {
            console.error(error);
        }

        return;
    }

    //
    // is Kindle Search Page?
    //
    if (document.querySelector('div#search') &&
        document.querySelector('div#nav-subnav[data-category="digital-text"]')
       ) {
        console.log("kiseppe: here is Kindle Search Page");

        console.log("wait a few seconds");
        await asinatsu_sleep(2000);
        console.log("ok, go!");

        //// kiseppe API になげるための ASIN の収集とグラフボタンの設置
        let alist = [];
        let calist = [];
        document.querySelectorAll(
	    'div[data-asin][data-component-type="s-search-result"]'
	).forEach(e => {
            let asin = e.dataset.asin;

            // kiseppe API になげるための ASIN の収集
            let seri = e.querySelector('div.a-row > a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style[href*="kindle_edition"]');
            if (seri) {
                const r = seri.getAttribute('href').match(/\/(B0[0-9A-Z]{8})/);
                calist.push("COL_" + r[1]);
                calist.push(asin);
            } else {
                alist.push(asin);
            }

            // グラフボタンの設置
            let item_title = e.querySelector('h2').textContent;
            let pgd = build_price_graph_dialog(asin, item_title);
            pgd.style.paddingRight = "3px";
            pgd.style.fontSize = "large";
            e.querySelector('h2').prepend(pgd);
        });
        // kiseppe API になげるための ASIN リスト
        let asins = [alist, calist].flat().join(",");

        // build API url
        const url = `${KS_JD_API}${asins}`;
        console.log(url);

        //// API になげてその結果を受けての処理
        await fetch(url).then(r => r.json()).then(res => {
	    const ri = res['result']['items'];
	    const rs = res['result']['series'];
            console.log(ri);
            console.log(rs);
            // API の結果のそれぞれの ASIN について処理
            Object.keys(ri).forEach(asin => {
                const cntn = document.querySelector('div[data-asin="'+asin+'"]');

		//// シリーズの作品のどれかの実質割引率が 15% 以上のときの処理
		let sr = cntn.querySelector('a[href*="binding=kindle_edition"]');
		if (rs && sr) {
		    let r = sr.getAttribute('href').match(/(B0[0-9A-Z]{8})/);
		    let srasin = r[0];
		    if (rs[srasin] && Number(rs[srasin]) >= 15) {
			//sr.innerHTML += '<span style="font-size: xx-small; background-color: #FFE8E8">🉐シリーズにセール作品あり</span>';
			let jh = document.createElement('span');
			jh.style.backgroundColor = "#FFE8E8";
			jh.style.fontSize = "xx-small";
			jh.innerHTML = '🉐シリーズにセール作品あり';
			sr.appendChild(jh);
		    }
		}
		
		//// この作品の実質割引率が 15% 以上のときの処理
                if (Number(ri[asin]) < 15 ) return;

		// 実質割引率の表示エリア
                let jh = document.createElement('span');
                jh.style.position = "absolute";
                jh.style.bottom = "1rem";
                jh.style.right = "1rem";
                jh.style.zIndex = "10000";
                jh.innerHTML = `🉐実質<b>${ri[asin]}</b>%オフ`;
                // 表示エリアをページに表示
                cntn.style.position = "relative";
                cntn.prepend(jh);

                // 割引作品の背景色を変更する
                const toumei = Number(ri[asin]) / 100 * 0.2;
                const c = cntn.querySelector('div[class^="s-card-container"] div[class$=s-list-col-right]');
                c.style.backgroundColor = `rgba(255,0,0,${toumei})`;

	    });
        });
        
        return;
    }

    //
    // is Kindle Store Page?
    //
    if (document.querySelector('#nav-subnav[data-category=digital-text]')) {
        console.log("kiseppe: here is Kindle Store Page");

        if (document.querySelector(
	    'div[class^="_octopus-search-result-card_"], div[class*="asin-container"]'
	)) {
            console.log("wait a few seconds");
            await asinatsu_sleep(2000);
            console.log("ok, go!");
        }

        // get all ASINs
	let aset = new Set();
        let caset = new Set();
        document.querySelectorAll("a[href]").forEach(e => {
	    const url = e.getAttribute('href');
            const r = url.match(/\/(B0[0-9A-Z]{8})/);
            if (! r) return;
	    if (/binding=kindle_edition/.test(url)) {
		caset.add('COL_' + r[1]);
	    } else {
		aset.add(r[1]);
	    }
        });
        console.log("aset:", aset.size, aset);
        console.log("caset:", caset.size, caset);
        let asins = Array.from(aset);
        let calist = Array.from(caset);

        // octopus_search トップにいくつか表示されるやつ の ASIN のみ取り出す
        // Ex. https://www.amazon.co.jp/b?node=22083216051
        const oct_asins = asins.filter(asin => document.querySelector(
	    `h2 a[href*="/dp/${asin}"],a[href*="/dp/${asin}"] h2`
	));
        console.log(oct_asins, oct_asins.length);
        let res = {};
	let ri = {};
	let rs = {};
        if (oct_asins.length > 0) {
            //// build API url and access
            const as = [oct_asins, calist].flat().join(",");
            const url = `${KS_JD_API}${as}`;
	    console.log(url);
            res = await fetch(url).then(r => r.json());
	    ri = res['result']['items'];
	    rs = res['result']['series'];
        } else { // search result 無いとき
            //// build API url and access
            const url = `${DEBUG_API}${asins}`;
            console.log(url);
            try {
                res = await fetch(url).then(r => r.json())
            } catch (error) {
                console.error(error);
            }
        }

        asins.forEach(asin => {

            // グリッド表示
            // Ex. https://www.amazon.co.jp/kindle-dbs/browse?metadata=cardAppType&storeType=ebooks&sourceType=recs&widgetId=unified-ebooks-storefront-default_KindleUnlimitedCrossCategoryStrategyEbookSources
            // 横スクロール表示
            // Ex. https://www.amazon.co.jp/kindle-dbs/storefront?storeType=browse&node=2275256051
            Array.from(document.querySelectorAll(
		`a[href^="/gp/product/${asin}"]`
	    )).forEach(e => {
                let item_title = '';
                if (e.getAttribute('aria-label')) {
                    // for グリッド表示
                    console.log('kiseppe: grid-30', asin, e);
                    item_title = e.getAttribute('aria-label')
                } else if (e.querySelector('img[alt][data-a-dynamic-image]')) {
                    // for 横スクロール表示
                    console.log('kiseppe: horizontal-scroll', asin, e);
                    item_title = e.querySelector('img[alt][data-a-dynamic-image]').getAttribute('alt');
		}
		// グラフボタンの設置
                if (/📊/.test(e.parentNode.textContent)) return;
                if (! item_title) return;
                let pgd = build_price_graph_dialog(asin, item_title);
                e.parentNode.insertBefore(pgd, e.nextSibling);
            });

            // 横並びだけどスクロールしないやつ
            // Ex. https://www.amazon.co.jp/b?node=2292699051
            Array.from(document.querySelectorAll(
		`li span[class="a-list-item"] a[href*="/dp/${asin}"]`
	    )).forEach(e => {
                console.log('kiseppe: no-scroll-list', asin, e);
                let c = e.closest('li');

		// グラフボタンの設置
                if (/📊/.test(c.textContent)) return;
                let item_title = '';
                if (e.querySelector('img[alt]'))
                    item_title = e.querySelector('img[alt]').getAttribute('alt');
                if (! item_title) return;
                let pgd = build_price_graph_dialog(asin, item_title);
                pgd.style.position = "absolute";
                pgd.style.bottom = "1rem";
                pgd.style.right = "1rem";
                pgd.style.zIndex = "10000";
                c.style.position = "relative";
                c.appendChild(pgd);
            });

            // octopus_search: トップにいくつか表示されるやつ
            // Ex. https://www.amazon.co.jp/b?node=22083216051
            let e;
            if (e = document.querySelector(
		`h2 a[href*="/dp/${asin}"]`
	    )) {
                console.log('kiseppe: octopus-search', asin, e);
                let cntn = e.closest('div[class*="s-card-container"]');
                console.log(cntn);

		// グラフボタンの設置
                if (/📊/.test(cntn.textContent)) return;
                let item_title = e.textContent;
                if (! item_title) return;
                let pgd = build_price_graph_dialog(asin, item_title);
                pgd.style.paddingRight = "3px";
                pgd.style.fontSize = "large";
                e.parentNode.prepend(pgd);

		//// シリーズの作品のどれかの実質割引率が 15% 以上のときの処理
		let sr = cntn.querySelector('a[href*="binding=kindle_edition"]');
		if (rs && sr) {
		    let r = sr.getAttribute('href').match(/(B0[0-9A-Z]{8})/);
		    let srasin = r[0];
		    if (rs[srasin] && Number(rs[srasin]) >= 15) {
			//sr.innerHTML += '<span style="font-size: xx-small; background-color: #FFE8E8">🉐シリーズにセール作品あり</span>';
			let jh = document.createElement('span');
			jh.style.backgroundColor = "#FFE8E8";
			jh.style.fontSize = "xx-small";
			jh.innerHTML = '🉐シリーズにセール作品あり';
			sr.appendChild(jh);
		    }
		}

                //// 実質割引率 15% 以上のもののみ処理を行う
                if (! ri[asin] || Number(ri[asin]) < 15) return;
                // 割引作品の背景色を変更する
                const toumei = Number(ri[asin]) / 100 * 0.2;
                cntn.style.backgroundColor = `rgba(255,0,0,${toumei})`;
                // 実質割引率の表示エリア
                let jh = document.createElement('div');
                jh.innerHTML = `🉐実質<b>${ri[asin]}</b>%オフ`;
                jh.style.textAlign = 'right';
                jh.style.marginTop = '0.5rem';
                //e.parentNode.prepend(jh);
                e.parentNode.parentNode.parentNode.appendChild(jh);
            }

            // セール＆キャンペーンなどで表示される検索結果表示
	    // Ex. https://www.amazon.co.jp/hko/deals/?_encoding=UTF8
            if (e = document.querySelector(
		`div[class*="asin-container"] a[href*="/dp/${asin}"]`
	    )) {
                console.log('kiseppe: grid-12', asin, e);
                let c = e.closest('div[class*="asin-container"]');

		// グラフボタンの設置
                if (/📊/.test(c.textContent)) return;
                item_title = e.querySelector('img[alt]').getAttribute('alt');
                if (! item_title) return;
                let pgd = build_price_graph_dialog(asin, item_title);
                pgd.style.position = "absolute";
                pgd.style.bottom = "0.1rem";
                pgd.style.left = "0.1rem";
                pgd.style.zIndex = "10000";
                c.style.position = "relative";
                c.appendChild(pgd);

                //// 実質割引率 15% 以上のもののみ処理を行う
                if (! ri[asin] || Number(ri[asin]) < 15) return;
                // 割引作品の背景色を変更する
                const toumei = Number(ri[asin]) / 100 * 0.3;
                c.style.background =
		    `linear-gradient(rgba(255,0,0,${toumei}), white)`;
                // 実質割引率の表示エリア
                let jh = document.createElement('div');
                jh.innerHTML = `🉐<br>実質<br><b>${ri[asin]}%</b><br>オフ`;
                jh.style.position = "absolute";
                jh.style.bottom = "0.1rem";
                jh.style.right = "0.3rem";
                jh.style.border = "1px solid brown";
                jh.style.padding = "0.1rem 0.2rem";
                jh.style.fontSize = "small";
                jh.style.lineHeight = "1.05em";
                c.appendChild(jh);
            }
        });

        return;
    }

};

main();


//
// price graph の dialog を作る
// (generates a dialog to display a Price Graph iframe)
//
function build_price_graph_dialog(asin, title) {
    //console.log('hello');

    // 表示ボタン
    let d = document.createElement('span');
    d.style.zIndex = "100000";
    d.style.cursor = "pointer";
    d.innerText = '📊';
    
    // クリックしたらグラフなどを表示
    d.addEventListener('click', (event) => {
        //// build API url (returns a web page for iframe)
        const url = 'https://www.listasin.net/api/0000/chex/' + asin + '--';
        console.log(url);

	// 共通 dialog エレメント、なければ作る
        let pp = document.getElementById("popup_modal");
        if (! pp) {
            pp = document.createElement('dialog');
            pp.id = "popup_modal";
            pp.addEventListener('click', e => 
                e.target.closest('#pg_container') || pp.close());
            document.querySelector("noscript").before(pp);
        }

        pp.innerHTML = `
<style>
dialog#popup_modal { border: none; border-radius: 8px; }
dialog#popup_modal::backdrop { background: rgba(0,0,0,.5); }
#pg_container { width: 850px; text-align: center; }
#pg_container .pg_item_info { height: 400px; }
#pg_container .pg_item_title { font-weight: bold; margin-bottom: 0.5rem;
  text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
#pg_container iframe {width: 100%; height: 100%; border: 0; overflow: visible;}
</style>
<div id="pg_container">
 <div class="pg_item_info">
  <div class="pg_item_title">${title}</div>
  <iframe src="${url}" scrolling="no"></iframe>
 </div>
 <button onclick="document.getElementById('popup_modal').close()">Close</button>
</div>
`;
        document.getElementById("popup_modal").showModal();

        event.stopPropagation();
    });

    return d;
}


//
// ASIN ページに price graph を表示する (kiseppe 1.0 の main())
// (inserts a Price Graph iframe in an ASIN page)
//
function asin_page_main() {

    //// すでにグラフが表示されてたら帰る
    if (document.getElementById('kiseppe')) return;

    //// iframeの高さを得る（あとで）
    window.addEventListener('message', function(e) {
        var iframe = document.getElementById("kiseppe");
        switch(e.data[0]) { // event name
        case 'setHeight':
            iframe.style.height = e.data[1] + "px";
            break;
        }
    }, false);

    //// 確認事項

    // Kindle本のページであるか
    if (! document.getElementById('nav-search-label-id')) return;
    if (! document.getElementById('nav-search-label-id').textContent.match(/Kindle/m)) return;

    // ASINがあるか
    if (! document.getElementById('ASIN')) return;
    const asin = document.getElementById('ASIN').value;
    if (! asin.match(/^B[0-9A-Z]{9}$/m)) return;
    console.log(`kiseppe: ${asin}`);

    //// Amazonページから価格を取得
    let _pr = document.getElementById('youPaySection');
    let price = _pr ? _pr.getAttribute('data-kindle-price').replace(/\.0$/, '') : '';
    // 期間限定無料＆kindle unlimited のとき？
    if (price == '') {
        _pr = document.getElementById('kindle-price');
        if (_pr) price = _pr.textContent.match(/([0-9,]+)/m)[1].replace(/,/g, '');
    }

    //// Amazonページから還元ポイントを取得
    let _po = Array.from(document.getElementsByClassName('total-points-value-display-column')).map(x => x.textContent).join('').match(/\+([0-9,]+) /m);
    let point = _po ? _po[1] : '';
    // 期間限定無料＆kindle unlimited のとき？
    if (point == '') {
        _po = document.getElementById('Ebooks-desktop-KINDLE_ALC-prices-loyaltyPoints');
        if (_po) point = _po.textContent.match(/ ([0-9,]+)/m)[1].replace(/,/g, '');
    }

    //// build API url (returns a web page for iframe)
    const url = 'https://www.listasin.net/api/0000/chex/' + asin + '-' + price + '-' + point;
    console.log(url);

    //// グラフの表示

    // iframeを作る
    let new_elm = document.createElement('div');
    new_elm.innerHTML = '<iframe style="width: 100%; height: 0px; border: 0; overflow: hidden;" src="' + url + '" scrolling="no" id="kiseppe"></iframe>';

    // iframeを挿入する
    let base_elm = document.getElementById('ATFCriticalFeaturesDataContainer');
    base_elm.after(new_elm);
};

