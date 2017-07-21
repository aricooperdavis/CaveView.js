
import {
	TextureLoader,
	MeshLambertMaterial,
	NearestFilter
} from '../../../../three.js/src/Three';


function Overlay ( getUrl, getLogo ) {

	this.getUrl = getUrl;
	this.getLogoFunc = getLogo;

}

Overlay.prototype.getLogo = function () {

	if ( this.getLogoFunc === undefined ) return;

	return this.getLogoFunc();

}

Overlay.prototype.getTile = function ( x, y, z, opacity, overlayLoaded ) {

	var url = this.getUrl( x, y, z );

	new TextureLoader().setCrossOrigin( 'anonymous' ).load( url, _textureLoaded );

	return;

	function _textureLoaded( texture ) {

		var material = new MeshLambertMaterial( { transparent: true, opacity: opacity, color: 0xffffff } );

		texture.magFilter = NearestFilter;

		material.map = texture;
		material.needsUpdate = true;

		overlayLoaded( material );

	}

};

Overlay.prototype.constructor = Overlay;

export { Overlay };
