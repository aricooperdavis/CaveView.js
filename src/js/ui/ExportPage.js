import { Page } from './Page';
import { replaceExtension } from '../core/lib';

function ExportPage ( frame, viewer, fileSelector ) {

	Page.call( this, 'icon_export', 'exports' );

	frame.addPage( this );

	this.addHeader( 'png_export.header' );

	const sizes = [];
	let mss = viewer.maxSnapshotSize;

	do { sizes.push( mss ); } while ( (mss /= 2) > 512 );

	const colors = [ 'black', 'white', 'transparent' ];

	const scales = [ 1, 2, 3, 4, 5, 6 ];

	const pngParams = {
		exportSize: sizes[ 0 ],
		backgroundColor: 'black',
		lineScale: 1
	};

	this.addSelect( 'png_export.background_color', colors, pngParams, 'backgroundColor' );
	this.addSelect( 'png_export.line_scale', scales, pngParams, 'lineScale' );
	this.addSelect( 'png_export.size', sizes, pngParams, 'exportSize' );

	this.addDownloadButton(
		'png_export.export',
		() => {
			const url = viewer.getSnapshot( pngParams.exportSize, pngParams.backgroundColor, pngParams.lineScale );
			return url;
		},
		'snapshot.png'
	);

	this.addHeader( 'gltf_export.header' );

	const selection = { legs: false, walls: false, scraps: false  };
	const options = { rotate: false, binary: false };

	if ( viewer.hasWalls ) {

		selection.walls = true;
		this.addCheckbox( 'gltf_export.walls', selection, 'walls' );

	}

	if ( viewer.hasScraps ) {

		selection.scraps = true;
		this.addCheckbox( 'gltf_export.scraps', selection, 'scraps' );

	}

	this.addCheckbox( 'gltf_export.legs', selection, 'legs' );

	this.addCheckbox( 'gltf_export.rotate_axes', options, 'rotate' );
	// this.addCheckbox( 'gltf_export.binary_format', options, 'binary' );

	this.addButton( 'gltf_export.export', function () {

		viewer.getGLTFExport( selection, options, handleExport );

	} );

	const self = this;

	return this;


	function handleExport ( gltfData, binary ) {

		var filename = replaceExtension( fileSelector.localFilename, ( binary ? 'glb' : 'gltf' ) );

		self.download( URL.createObjectURL( gltfData ), filename );

	}

}

ExportPage.prototype = Object.create( Page.prototype );

export { ExportPage };