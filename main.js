//javascript:(function(){document.body.appendChild(document.createElement('script')).src='http://grabr.dev/main.js';})();

/*
	Cases to solve:
		external CSS sheets on different sub-domain,
		favicons
*/

var Grabr = {
	doc: {
		w: 0,
		h: 0,
		loc: location.href,
		locSplit: location.href.split('/'),
		root: location.hostname,
		jquery: false
	},
	set: {
		showImgs: false
	},
	reg: {
		testURL: /(url\(\S+\))/g,
		extLink: /^(https?:)?(\/\/)/,
		cssFileName: /[^\/]*css.*$/,
		revRemove: /\w*\/$/,
		isImg: /(png)|(jpg)|(jpeg)|(gif)|(bmp)/i,
		marklet: /grabr\.dev/,
		relURL: /^\.{0,2}\//,
		base64: /base64/
	},
	images: [],
	notices: [],
	num: 0,
	testNum: 0,
	init: function(){
	
		Grabr.testForJquery();

	},
	testJqueryVersion: function(){
		try {
			return (parseFloat($.fn.jquery) < 1.7) ? true : false;
		} catch(err) {
			return true;
		}
	},
	testForJquery: function(){
		if(!window.jQuery || Grabr.testJqueryVersion()) {
			if(!Grabr.doc.jquery) {
				var s;
			    s = document.createElement('script');
			    s.type = 'text/javascript';
			    document.body.appendChild(s);
			    s.src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
			    Grabr.doc.jquery = true;
			}
	        setTimeout(Grabr.testForJquery, 100)
	    } else {
	    	var insert = '<link rel="stylesheet" href="http://grabr.dev/gfx/default.css" />'
	    	insert += '<div id="grabr-header"><div id="grabr-logo"></div>'
	    	insert += '<div id="grabr-colors"><div class="grabr-bg-color"></div><div class="grabr-bg-color"></div><div class="grabr-bg-color"></div></div>'
	    	insert += '<table id="grabr-notices"><tr><td id="grabr-notice-title">Notices</td><td id="grabr-notice-info"></td></tr></table></div>' // end of header
	    	insert += '<div id="grabr-screen"></div>'
	    	$('body').append(insert)
	    	if(Grabr.reg.cssFileName.test(Grabr.doc.loc)) {
	    		Grabr.cssPage()
	    	} else {
	    		Grabr.getImages();
		        Grabr.getCSSImages();
	    	}	    
		}
	},
	getImages: function(){
		var imgs = $('img').get(),
			l = imgs.length;
			
		for(var i=0; i < l; i++) {
			//If image is not on the same domain then reduce Grabr.num instead of increasing.
			if(Grabr.testExternal(imgs[i].src)) {
				//console.log(Grabr.num, " img tags local")
				Grabr.num++
				Grabr.getImageData(imgs[i].src);
			} else {
				var imgData = {
					src: imgs[i].src,
					format: false,
					width: false,
					height: false
				}
				Grabr.images.push(imgData);
			}
		}
		
	},
	cssPage: function(){
		
		var text = $('body').html(),
			len = Grabr.doc.locSplit.length,
			href = "",
			urls = [];
		
		for(var i=3; i < len; i++) {
			href += Grabr.doc.locSplit[i] 
			href += ((len-1) !== i) ? '/' : '';
		}
		
		urls = text.match(Grabr.reg.testURL);
		
		Grabr.createImgTags(urls, href);
		
	},
	getImageData: function(img){
	    

	    function mycallback() {
	    	Grabr.testNum++;
	    	// ImageInfo.getAllFields(file) or ImageInfo.getField(file, field)
	    	var imgData = {
	    		src: img,
	    		format: ImageInfo.getField(img, "format"),
	    		width: ImageInfo.getField(img, "width"),
	    		height: ImageInfo.getField(img, "height"),
	    		bpp: ImageInfo.getField(img, "bpp"), /* Bits per pixel */
	    		alpha: ImageInfo.getField(img, "alpha"),
	    		bytes: ImageInfo.getField(img, "byteSize"),
	    		exif: ImageInfo.getField(img, "exif").toSource()
	    	}
			Grabr.images.push(imgData);
			if(Grabr.num === Grabr.testNum) { Grabr.printImages(); }
	    }
	    
	    // finally, load the data
	    ImageInfo.loadInfo(img, mycallback);
		
	},
	getCSSImages: function(){
		var linkURL = [],
			len = 0,
			imgTagArr = [];
				
		//console.log(document.styleSheets)
		
		$('link').each(function(){
			if($(this).attr('rel').toLowerCase() == 'stylesheet') {
				linkURL.push($(this).attr('href'));
			}
		})
		
		len = linkURL.length;
		
		//Repeats for each style sheet
		for(var i=0; i < len; i++) {
			
			if(Grabr.testExternal(linkURL[i])) {
				
				var l = document.styleSheets[i].cssRules.length,
					urls = [];

			    //Repeats through each rule in the style sheet
			    for(var j=0; j < l; j++) {
			    	//Finds styles within the css sheet
			    	style = document.styleSheets[i].cssRules[j].cssText;
			    	//Finds urls within the defined styles
			    	var tempArr = style.match(Grabr.reg.testURL)
			    	if(tempArr != null) {
			    		for(var k=0; k < tempArr.length; k++) {
			    			//Pushes styles into an array
			    			urls.push(tempArr[k]);	
			    		}
			    	}
			    }
			    
			    Grabr.createImgTags(urls, linkURL[i]);
			} else {
				if(!Grabr.reg.marklet.test(linkURL[i])) {
					Grabr.notices.push('<a href="'+linkURL[i]+'" title="Click this link to see the style sheet and don\'t forget to ^Grabr it" target="_blank">'+linkURL[i]+'</a><br />');
				}
			}
		}
		
		Grabr.printNotices();		
	},
	testExternal: function(link){
		var split = link.split('/');
		if(Grabr.reg.extLink.test(link)) {
			if(Grabr.doc.locSplit[2] === split[2]) {
		    	//console.log('http','has-host', link)
		    	return true;
		    } else {
		    	//console.log('http','not-host', link)
		    	return false;
		    }
		} else {
		    //console.log('relative link', link)
		    return true;
		}
	},
	createImgTags: function(urlArr, href){
		var len = urlArr.length,
			openedArr = [],
			url = href.replace(Grabr.reg.cssFileName, ""),
			root = Grabr.doc.locSplit[0] + "//" + Grabr.doc.locSplit[2] + "/";
		
		//console.log(href)
		
		if(!Grabr.reg.extLink.test(url)) {
			url = url.replace(Grabr.reg.relURL, "");
		}
		
		for(var i=0; i < len; i++) {
			var l = openedArr.length,
				skip = false;
				
			//Remove repeated image links
			for(var j=0; j < l; j++) {
				if(openedArr[j] === urlArr[i]) skip = true;
			}
			
			//Record unique images with correct urls
			if(!skip) {
				if(Grabr.reg.isImg.test(urlArr[i])) {
				
					openedArr.push(urlArr[i]);
					var img = urlArr[i].replace(/url\("?/, "").replace(/"?\)/,"");
					
					//New else if for base 64 images... starts of like this data:image/ image format...
					if(Grabr.reg.extLink.test(img)) {
						var arr = img.match(Grabr.reg.extLink),
							http = "";
						http = (arr[0] == '//') ? "http:" : "";
						Grabr.num++
						Grabr.getImageData(http + img);
					} else if(Grabr.reg.relURL.test(img)) {
						Grabr.num++
						Grabr.getImageData(root+img);
					} else if(Grabr.reg.base64.test(img)) {
						var imgData = {
							src: img,
							format: false,
							width: false,
							height: false
						}
						Grabr.images.push(imgData);
					} else {
						Grabr.num++
						Grabr.getImageData(root+url+img);
					}
				}
			}
				
		} //End for loop
		
	},
	printNotices: function(){
		var len = Grabr.notices.length,
			errSS = "";
		
		if(len > 0) {
			errSS += "Security Exception: Stylesheet is not hosted on the same domain&hellip;<br />"
			for(var i=0; i < len; i++) {
				errSS += Grabr.notices[i];
			}
		}
		
		if(errSS == "") {
			$('#grabr-notice-info').html('Sweeeeeet as, nothing to report here!')
		} else {
			$('#grabr-notice-info').html(errSS);
		}
		
	},
	printImages: function(){
		var len = Grabr.images.length,
			errArr = [],
			errLen = 0,
			imgs = "";
		
		for(var i=0; i < len; i++) {
			if(!Grabr.images[i].format) {
				errArr.push({'num': i, 'src': Grabr.images[i].src}) 
				errLen++;	
			}
			imgs += '<div id="grabr-'+i+'" class="grabr-image-area"><img class="grabr-image" src="' + Grabr.images[i].src + '" /><br />';
			imgs += '<table class="grabr-detail-table"><thead><tr><th>Source</th><th>Format</th><th>Width</th><th>Height</th><th>Bits</th><th>Alpha</th><th>Size</th><th>EXIF</th></tr></thead>';
			imgs += '<tbody><tr><td id="grabr-img">'+Grabr.images[i].src+'</td><td id="grabr-for">'+Grabr.images[i].format+'</td><td id="grabr-w">'+Grabr.images[i].width+'</td><td id="grabr-h">'+Grabr.images[i].height+'</td><td>'+Grabr.images[i].bpp+'</td><td>'+Grabr.images[i].alpha+'</td><td>'+Grabr.images[i].bytes+'</td><td>'+Grabr.images[i].exif+'</td></tr></tbody></table></div>';
		}
		
		$('body').append('<div id="grabr-images"><p id="grabr-img-tot">Total images found '+len+'</p>'+imgs+'</div>');
		
		$('#grabr-header').on('click', function(){
			if(Grabr.set.showImgs) {
				$('#grabr-screen').fadeIn(200, function(){
					$('#grabr-images').show();	
				});
				Grabr.set.showImgs = false;
			} else {
				$('#grabr-images').hide();
				$('#grabr-screen').fadeOut();
				Grabr.set.showImgs = true;
			}
			
		})
		
		for(var i=0; i < errLen; i++) {
			var src = errArr[i].src,
				num = errArr[i].num,
				$el = $('#grabr-'+num),
				w = 0,
				h = 0,
				f = "";
				
			w = $el.find('img').width();
			h = $el.find('img').height();
			f = Grabr.reg.isImg.exec(src);
			if(f) {
				f = f[0].toUpperCase()
			}
			$el.find('#grabr-img').html('<a href="'+src+'" title="Go to source and use bookmarklet there for more info on this image">'+src+'</a>');
			$el.find('#grabr-for').html(f);
			$el.find('#grabr-w').text(w);
			$el.find('#grabr-h').text(h);
		}
		
		function changeColorTo(color) {
			$('#grabr-screen').css('background-color', color)
		}
		
		
		$('#grabr-colors').on('click', 'div', function(){
			switch($(this).index()){
				case 0:
					changeColorTo('rgba(255,255,255,0.95)')
					break;
				case 1:
					changeColorTo('rgba(115,115,115,0.95)')
					break;
				case 2:
					changeColorTo('rgba(0,0,0,0.90)')
					break;
			}
			return false;
		})
		
	}
};

/*
 * Binary Ajax 0.1.5
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 */
var BinaryFile=function(i,g,h){var e=i,f=g||0,c=0;this.getRawData=function(){return e};"string"==typeof i?(c=h||e.length,this.getByteAt=function(a){return e.charCodeAt(a+f)&255}):"unknown"==typeof i&&(c=h||IEBinary_getLength(e),this.getByteAt=function(a){return IEBinary_getByteAt(e,a+f)});this.getLength=function(){return c};this.getSByteAt=function(a){a=this.getByteAt(a);return 127<a?a-256:a};this.getShortAt=function(a,c){var d=c?(this.getByteAt(a)<<8)+this.getByteAt(a+1):(this.getByteAt(a+1)<<8)+ this.getByteAt(a);0>d&&(d+=65536);return d};this.getSShortAt=function(a,c){var d=this.getShortAt(a,c);return 32767<d?d-65536:d};this.getLongAt=function(a,c){var d=this.getByteAt(a),b=this.getByteAt(a+1),e=this.getByteAt(a+2),f=this.getByteAt(a+3),d=c?(((d<<8)+b<<8)+e<<8)+f:(((f<<8)+e<<8)+b<<8)+d;0>d&&(d+=4294967296);return d};this.getSLongAt=function(a,c){var d=this.getLongAt(a,c);return 2147483647<d?d-4294967296:d};this.getStringAt=function(a,c){for(var d=[],b=a,e=0;b<a+c;b++,e++)d[e]=String.fromCharCode(this.getByteAt(b)); return d.join("")};this.getCharAt=function(a){return String.fromCharCode(this.getByteAt(a))};this.toBase64=function(){return window.btoa(e)};this.fromBase64=function(a){e=window.atob(a)}},BinaryAjax=function(){function i(){var e=null;window.XMLHttpRequest?e=new XMLHttpRequest:window.ActiveXObject&&(e=new ActiveXObject("Microsoft.XMLHTTP"));return e}function g(e,f,c){var a=i();a?(f&&("undefined"!=typeof a.onload?a.onload=function(){"200"==a.status?f(this):c&&c();a=null}:a.onreadystatechange=function(){4== a.readyState&&("200"==a.status?f(this):c&&c(),a=null)}),a.open("HEAD",e,!0),a.send(null)):c&&c()}function h(e,f,c,a,j,d){var b=i();if(b){var h=0;a&&!j&&(h=a[0]);var g=0;a&&(g=a[1]-a[0]+1);f&&("undefined"!=typeof b.onload?b.onload=function(){"200"==b.status||"206"==b.status?(this.binaryResponse=new BinaryFile(this.responseText,h,g),this.fileSize=d||this.getResponseHeader("Content-Length"),f(this)):c&&c();b=null}:b.onreadystatechange=function(){4==b.readyState&&("200"==b.status||"206"==b.status?(this.binaryResponse= new BinaryFile(b.responseBody,h,g),this.fileSize=d||this.getResponseHeader("Content-Length"),f(this)):c&&c(),b=null)});b.open("GET",e,!0);b.overrideMimeType&&b.overrideMimeType("text/plain; charset=x-user-defined");a&&j&&b.setRequestHeader("Range","bytes="+a[0]+"-"+a[1]);b.setRequestHeader("If-Modified-Since","Sat, 1 Jan 1970 00:00:00 GMT");b.send(null)}else c&&c()}return function(e,f,c,a){a?g(e,function(g){var d=parseInt(g.getResponseHeader("Content-Length"),10),g=g.getResponseHeader("Accept-Ranges"), b;b=a[0];0>a[0]&&(b+=d);h(e,f,c,[b,b+a[1]-1],"bytes"==g,d)}):h(e,f,c)}}();document.write("<script type='text/vbscript'>\r\nFunction IEBinary_getByteAt(strBinary, iOffset)\r\n\tIEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\nEnd Function\r\nFunction IEBinary_getLength(strBinary)\r\n\tIEBinary_getLength = LenB(strBinary)\r\nEnd Function\r\n<\/script>\r\n");

/*
 * ImageInfo 0.1.2 - A JavaScript library for reading image metadata.
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * MIT License [http://www.nihilogic.dk/licenses/mit-license.txt]
 */
var ImageInfo={useRange:!1,range:10240}; (function(){function h(a,b){BinaryAjax(a,function(c){var e=i(c.binaryResponse),d=c.getResponseHeader("Content-Type");e.mimeType=d;e.byteSize=c.fileSize;f[a]=e;b&&b()},null,ImageInfo.useRange?[0,ImageInfo.range]:null)}function i(a){if(255==a.getByteAt(0)&&216==a.getByteAt(1)){for(var b=0,c=0,e=0,d=a.getLength(),g=2;g<d;){var f=a.getShortAt(g,!0),g=g+2;if(65472==f){c=a.getShortAt(g+3,!0);b=a.getShortAt(g+5,!0);e=a.getByteAt(g+7,!0);break}else g+=a.getShortAt(g,!0)}d={};"undefined"!=typeof EXIF&&EXIF.readFromBinaryFile&& (d=EXIF.readFromBinaryFile(a));return{format:"JPEG",version:"",width:b,height:c,bpp:8*e,alpha:!1,exif:d}}if(137==a.getByteAt(0)&&"PNG"==a.getStringAt(1,3))return b=a.getLongAt(16,!0),c=a.getLongAt(20,!0),d=a.getByteAt(24),e=a.getByteAt(25),4==e&&(d*=2),2==e&&(d*=3),6==e&&(d*=4),a=4<=a.getByteAt(25),{format:"PNG",version:"",width:b,height:c,bpp:d,alpha:a,exif:{}};if("GIF"==a.getStringAt(0,3))return b=a.getStringAt(3,3),c=a.getShortAt(6),e=a.getShortAt(8),a=(a.getByteAt(10)>>4&7)+1,{format:"GIF",version:b, width:c,height:e,bpp:a,alpha:!1,exif:{}};return 66==a.getByteAt(0)&&77==a.getByteAt(1)?(b=a.getLongAt(18),c=a.getLongAt(22),a=a.getShortAt(28),{format:"BMP",version:"",width:b,height:c,bpp:a,alpha:!1,exif:{}}):0==a.getByteAt(0)&&0==a.getByteAt(1)?readICOInfo(a):{format:"UNKNOWN"}}var f=[];ImageInfo.loadInfo=function(a,b){f[a]?b&&b():h(a,b)};ImageInfo.getAllFields=function(a){if(!f[a])return null;var b={},c;for(c in f[a])f[a].hasOwnProperty(c)&&(b[c]=f[a][c]);return b};ImageInfo.getField=function(a, b){return!f[a]?null:f[a][b]}})();

/*
 * Javascript EXIF Reader 0.1.2
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 */
var EXIF={}; (function(){function j(a,b,c){a.addEventListener?a.addEventListener(b,c,!1):a.attachEvent&&a.attachEvent("on"+b,c)}function n(a,b){BinaryAjax(a.src,function(c){c=l(c.binaryResponse);a.exifdata=c||{};b&&b()})}function l(a){if(255!=a.getByteAt(0)||216!=a.getByteAt(1))return!1;for(var b=2,c=a.getLength();b<c;){if(255!=a.getByteAt(b))return h&&console.log("Not a valid marker at offset "+b+", found: "+a.getByteAt(b)),!1;var e=a.getByteAt(b+1);if(22400==e||225==e)return h&&console.log("Found 0xFFE1 marker"),m(a, b+4,a.getShortAt(b+2,!0)-2);b+=2+a.getShortAt(b+2,!0)}}function i(a,b,c,e,f){for(var d=a.getShortAt(c,f),g={},i=0;i<d;i++){var k=c+12*i+2,j=e[a.getShortAt(k,f)];!j&&h&&console.log("Unknown tag: "+a.getShortAt(k,f));g[j]=o(a,k,b,c,f)}return g}function o(a,b,c,e,f){var d=a.getShortAt(b+2,f),e=a.getLongAt(b+4,f),c=a.getLongAt(b+8,f)+c;switch(d){case 1:case 7:if(1==e)return a.getByteAt(b+8,f);c=4<e?c:b+8;b=[];for(d=0;d<e;d++)b[d]=a.getByteAt(c+d);return b;case 2:return a.getStringAt(4<e?c:b+8,e-1);case 3:if(1== e)return a.getShortAt(b+8,f);c=2<e?c:b+8;b=[];for(d=0;d<e;d++)b[d]=a.getShortAt(c+2*d,f);return b;case 4:if(1==e)return a.getLongAt(b+8,f);b=[];for(d=0;d<e;d++)b[d]=a.getLongAt(c+4*d,f);return b;case 5:if(1==e)return a.getLongAt(c,f)/a.getLongAt(c+4,f);b=[];for(d=0;d<e;d++)b[d]=a.getLongAt(c+8*d,f)/a.getLongAt(c+4+8*d,f);return b;case 9:if(1==e)return a.getSLongAt(b+8,f);b=[];for(d=0;d<e;d++)b[d]=a.getSLongAt(c+4*d,f);return b;case 10:if(1==e)return a.getSLongAt(c,f)/a.getSLongAt(c+4,f);b=[];for(d= 0;d<e;d++)b[d]=a.getSLongAt(c+8*d,f)/a.getSLongAt(c+4+8*d,f);return b}}function m(a,b){if("Exif"!=a.getStringAt(b,4))return h&&console.log("Not valid EXIF data! "+a.getStringAt(b,4)),!1;var c,e=b+6;if(18761==a.getShortAt(e))c=!1;else if(19789==a.getShortAt(e))c=!0;else return h&&console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)"),!1;if(42!=a.getShortAt(e+2,c))return h&&console.log("Not valid TIFF data! (no 0x002A)"),!1;if(8!=a.getLongAt(e+4,c))return h&&console.log("Not valid TIFF data! (First offset not 8)", a.getShortAt(e+4,c)),!1;var f=i(a,e,e+8,EXIF.TiffTags,c);if(f.ExifIFDPointer){var d=i(a,e,e+f.ExifIFDPointer,EXIF.Tags,c),g;for(g in d){switch(g){case "LightSource":case "Flash":case "MeteringMode":case "ExposureProgram":case "SensingMethod":case "SceneCaptureType":case "SceneType":case "CustomRendered":case "WhiteBalance":case "GainControl":case "Contrast":case "Saturation":case "Sharpness":case "SubjectDistanceRange":case "FileSource":d[g]=EXIF.StringValues[g][d[g]];break;case "ExifVersion":case "FlashpixVersion":d[g]= String.fromCharCode(d[g][0],d[g][1],d[g][2],d[g][3]);break;case "ComponentsConfiguration":d[g]=EXIF.StringValues.Components[d[g][0]]+EXIF.StringValues.Components[d[g][1]]+EXIF.StringValues.Components[d[g][2]]+EXIF.StringValues.Components[d[g][3]]}f[g]=d[g]}}if(f.GPSInfoIFDPointer)for(g in c=i(a,e,e+f.GPSInfoIFDPointer,EXIF.GPSTags,c),c){switch(g){case "GPSVersionID":c[g]=c[g][0]+"."+c[g][1]+"."+c[g][2]+"."+c[g][3]}f[g]=c[g]}return f}var h=!1;EXIF.Tags={36864:"ExifVersion",40960:"FlashpixVersion", 40961:"ColorSpace",40962:"PixelXDimension",40963:"PixelYDimension",37121:"ComponentsConfiguration",37122:"CompressedBitsPerPixel",37500:"MakerNote",37510:"UserComment",40964:"RelatedSoundFile",36867:"DateTimeOriginal",36868:"DateTimeDigitized",37520:"SubsecTime",37521:"SubsecTimeOriginal",37522:"SubsecTimeDigitized",33434:"ExposureTime",33437:"FNumber",34850:"ExposureProgram",34852:"SpectralSensitivity",34855:"ISOSpeedRatings",34856:"OECF",37377:"ShutterSpeedValue",37378:"ApertureValue",37379:"BrightnessValue", 37380:"ExposureBias",37381:"MaxApertureValue",37382:"SubjectDistance",37383:"MeteringMode",37384:"LightSource",37385:"Flash",37396:"SubjectArea",37386:"FocalLength",41483:"FlashEnergy",41484:"SpatialFrequencyResponse",41486:"FocalPlaneXResolution",41487:"FocalPlaneYResolution",41488:"FocalPlaneResolutionUnit",41492:"SubjectLocation",41493:"ExposureIndex",41495:"SensingMethod",41728:"FileSource",41729:"SceneType",41730:"CFAPattern",41985:"CustomRendered",41986:"ExposureMode",41987:"WhiteBalance",41988:"DigitalZoomRation", 41989:"FocalLengthIn35mmFilm",41990:"SceneCaptureType",41991:"GainControl",41992:"Contrast",41993:"Saturation",41994:"Sharpness",41995:"DeviceSettingDescription",41996:"SubjectDistanceRange",40965:"InteroperabilityIFDPointer",42016:"ImageUniqueID"};EXIF.TiffTags={256:"ImageWidth",257:"ImageHeight",34665:"ExifIFDPointer",34853:"GPSInfoIFDPointer",40965:"InteroperabilityIFDPointer",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",274:"Orientation",277:"SamplesPerPixel",284:"PlanarConfiguration", 530:"YCbCrSubSampling",531:"YCbCrPositioning",282:"XResolution",283:"YResolution",296:"ResolutionUnit",273:"StripOffsets",278:"RowsPerStrip",279:"StripByteCounts",513:"JPEGInterchangeFormat",514:"JPEGInterchangeFormatLength",301:"TransferFunction",318:"WhitePoint",319:"PrimaryChromaticities",529:"YCbCrCoefficients",532:"ReferenceBlackWhite",306:"DateTime",270:"ImageDescription",271:"Make",272:"Model",305:"Software",315:"Artist",33432:"Copyright"};EXIF.GPSTags={"0":"GPSVersionID",1:"GPSLatitudeRef", 2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude",5:"GPSAltitudeRef",6:"GPSAltitude",7:"GPSTimeStamp",8:"GPSSatellites",9:"GPSStatus",10:"GPSMeasureMode",11:"GPSDOP",12:"GPSSpeedRef",13:"GPSSpeed",14:"GPSTrackRef",15:"GPSTrack",16:"GPSImgDirectionRef",17:"GPSImgDirection",18:"GPSMapDatum",19:"GPSDestLatitudeRef",20:"GPSDestLatitude",21:"GPSDestLongitudeRef",22:"GPSDestLongitude",23:"GPSDestBearingRef",24:"GPSDestBearing",25:"GPSDestDistanceRef",26:"GPSDestDistance",27:"GPSProcessingMethod",28:"GPSAreaInformation", 29:"GPSDateStamp",30:"GPSDifferential"};EXIF.StringValues={ExposureProgram:{"0":"Not defined",1:"Manual",2:"Normal program",3:"Aperture priority",4:"Shutter priority",5:"Creative program",6:"Action program",7:"Portrait mode",8:"Landscape mode"},MeteringMode:{"0":"Unknown",1:"Average",2:"CenterWeightedAverage",3:"Spot",4:"MultiSpot",5:"Pattern",6:"Partial",255:"Other"},LightSource:{"0":"Unknown",1:"Daylight",2:"Fluorescent",3:"Tungsten (incandescent light)",4:"Flash",9:"Fine weather",10:"Cloudy weather", 11:"Shade",12:"Daylight fluorescent (D 5700 - 7100K)",13:"Day white fluorescent (N 4600 - 5400K)",14:"Cool white fluorescent (W 3900 - 4500K)",15:"White fluorescent (WW 3200 - 3700K)",17:"Standard light A",18:"Standard light B",19:"Standard light C",20:"D55",21:"D65",22:"D75",23:"D50",24:"ISO studio tungsten",255:"Other"},Flash:{"0":"Flash did not fire",1:"Flash fired",5:"Strobe return light not detected",7:"Strobe return light detected",9:"Flash fired, compulsory flash mode",13:"Flash fired, compulsory flash mode, return light not detected", 15:"Flash fired, compulsory flash mode, return light detected",16:"Flash did not fire, compulsory flash mode",24:"Flash did not fire, auto mode",25:"Flash fired, auto mode",29:"Flash fired, auto mode, return light not detected",31:"Flash fired, auto mode, return light detected",32:"No flash function",65:"Flash fired, red-eye reduction mode",69:"Flash fired, red-eye reduction mode, return light not detected",71:"Flash fired, red-eye reduction mode, return light detected",73:"Flash fired, compulsory flash mode, red-eye reduction mode", 77:"Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",79:"Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",89:"Flash fired, auto mode, red-eye reduction mode",93:"Flash fired, auto mode, return light not detected, red-eye reduction mode",95:"Flash fired, auto mode, return light detected, red-eye reduction mode"},SensingMethod:{1:"Not defined",2:"One-chip color area sensor",3:"Two-chip color area sensor",4:"Three-chip color area sensor", 5:"Color sequential area sensor",7:"Trilinear sensor",8:"Color sequential linear sensor"},SceneCaptureType:{"0":"Standard",1:"Landscape",2:"Portrait",3:"Night scene"},SceneType:{1:"Directly photographed"},CustomRendered:{"0":"Normal process",1:"Custom process"},WhiteBalance:{"0":"Auto white balance",1:"Manual white balance"},GainControl:{"0":"None",1:"Low gain up",2:"High gain up",3:"Low gain down",4:"High gain down"},Contrast:{"0":"Normal",1:"Soft",2:"Hard"},Saturation:{"0":"Normal",1:"Low saturation", 2:"High saturation"},Sharpness:{"0":"Normal",1:"Soft",2:"Hard"},SubjectDistanceRange:{"0":"Unknown",1:"Macro",2:"Close view",3:"Distant view"},FileSource:{3:"DSC"},Components:{"0":"",1:"Y",2:"Cb",3:"Cr",4:"R",5:"G",6:"B"}};EXIF.getData=function(a,b){if(!a.complete)return!1;a.exifdata?b&&b():n(a,b);return!0};EXIF.getTag=function(a,b){return!a.exifdata?void 0:a.exifdata[b]};EXIF.pretty=function(a){if(!a.exifdata)return"";var a=a.exifdata,b="",c;for(c in a)a.hasOwnProperty(c)&&(b="object"==typeof a[c]? b+(c+" : ["+a[c].length+" values]\r\n"):b+(c+" : "+a[c]+"\r\n"));return b};EXIF.readFromBinaryFile=function(a){return l(a)};j(window,"load",function(){for(var a=document.getElementsByTagName("img"),b=0;b<a.length;b++)"true"==a[b].getAttribute("exif")&&(a[b].complete?EXIF.getData(a[b]):j(a[b],"load",function(){EXIF.getData(this)}))})})();

Grabr.init();
