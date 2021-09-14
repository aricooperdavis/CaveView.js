import {
	BufferGeometry, Points, Vector3, Float32BufferAttribute,
	InterleavedBuffer, InterleavedBufferAttribute
} from '../Three';

import { STATION_ENTRANCE } from '../core/constants';
import { PointIndicator } from './PointIndicator';

const __v = new Vector3();

class Stations extends Points {

	constructor ( ctx, selection ) {

		super( new BufferGeometry, ctx.materials.getExtendedPointsMaterial() );

		this.type = 'CV.Stations';
		this.stationCount = 0;

		const cfg = ctx.cfg;

		this.baseColor     = cfg.themeColor( 'stations.default.marker' );
		this.junctionColor = cfg.themeColor( 'stations.junctions.marker' );
		this.entranceColor = cfg.themeColor( 'stations.entrances.marker' );

		this.vertices = [];
		this.pointSizes = [];
		this.instanceData = [];

		this.selected = null;
		this.selectedSize = 0;
		this.selection = selection;
		this.splaysVisible = false;

		const point = new PointIndicator( ctx, 0xff0000 );

		point.visible = false;

		this.addStatic( point );
		this.highlightPoint = point;
	}

	raycast ( raycaster, intersects ) {

		// augument three.js raycasting

		super.raycast( raycaster, intersects );

		const camera = raycaster.camera;
		const skipSplays = ! this.splaysVisible;

		// resassign distances - Raycaster sorts before returning array
		intersects.forEach( intersect => {

			if ( intersect.object !== this ) return;

			const station = this.vertices[ intersect.index ];

			// station in screen NDC
			__v.copy( station ).applyMatrix4( this.matrixWorld ).project( camera );

			// FIXME shoyld this be ray point
			__v.sub( intersect.point.project( camera ) );

			let distance;

			if ( skipSplays && station.connections === 0 ) {

				distance = Infinity;

			} else {

				distance  = __v.x * __v.x + __v.y * __v.y;

			}

			intersect.distance = distance;
			intersect.station = station;

		} );

		return intersects;

	}

	addStation ( node ) {

		if ( node.legs !== undefined ) return; // duplicated entry

		const instanceData = this.instanceData;
		const offset = instanceData.length;

		let pointSize = 0.0;
		let color;

		if ( node.type & STATION_ENTRANCE ) {

			color = this.entranceColor;
			pointSize = 12.0;

		} else {

			color = node.connections > 2 ? this.junctionColor : this.baseColor;
			pointSize = 8.0;

		}


		this.vertices.push( node );

		node.toArray( instanceData, offset );
		color.toArray( instanceData, offset + 3 );

		this.pointSizes.push( pointSize );

		node.stationVertexIndex = this.stationCount++;
		node.linkedSegments = [];
		node.legs = [];

	}

	getVisibleStation ( node ) {

		if ( this.selection.contains( node.id ) &&
			( node.connections > 0 || this.splaysVisible )
		) return node;

		if ( node.label !== undefined ) node.label.visible = false;

		return null;

	}

	getStationByIndex ( index ) {

		return this.vertices[ index ];

	}

	clearSelected () {

		if ( this.selected !== null ) {

			const pSize = this.geometry.getAttribute( 'pSize' );

			pSize.setX( this.selected, this.selectedSize );
			pSize.needsUpdate = true;

			this.selected = null;

		}

	}

	highlightStation ( node ) {

		const highlightPoint = this.highlightPoint;

		highlightPoint.position.copy( node );
		highlightPoint.updateMatrix();

		highlightPoint.visible = true;

		return node;

	}

	clearHighlight () {

		this.highlightPoint.visible = false;

	}

	selectStation ( node ) {

		this.selectStationByIndex( node.stationVertexIndex );

	}

	selectStationByIndex ( index ) {

		const pSize = this.geometry.getAttribute( 'pSize' );

		if ( this.selected !== null ) {

			pSize.setX( this.selected, this.selectedSize );

		}

		this.selectedSize = pSize.getX( index );

		pSize.setX( index, this.selectedSize * 2 );
		pSize.needsUpdate = true;

		this.selected = index;

	}

	selectStations ( selection ) {

		const vertices = this.vertices;
		const l = vertices.length;
		const pSize = this.geometry.getAttribute( 'pSize' );
		const splaySize = this.splaysVisible ? 6.0 : 0.0;
		const idSet = selection.getIds();
		const isEmpty = selection.isEmpty();

		for ( let i = 0; i < l; i++ ) {

			const node = vertices[ i ];

			let size = 8;

			if ( isEmpty || idSet.has( node.id ) ) {

				if ( node.type & STATION_ENTRANCE ) {

					size = 12;

				} else if ( node.connections === 0 ) {

					size = splaySize;

				}

				pSize.setX( i, size );

			} else {

				pSize.setX( i, 0 );

				if ( node.label !== undefined ) node.label.visible = false;

			}

		}

		pSize.needsUpdate = true;

	}

	finalise () {

		const bufferGeometry = this.geometry;

		const buffer = new Float32Array( this.instanceData );
		const instanceBuffer = new InterleavedBuffer( buffer, 6 ); // position, color, pSize

		bufferGeometry.setAttribute( 'position', new InterleavedBufferAttribute( instanceBuffer, 3, 0 ) );
		bufferGeometry.setAttribute( 'color', new InterleavedBufferAttribute( instanceBuffer, 3, 3 ) );

		// non-interleaved to avoid excess data uploads to GPU
		bufferGeometry.setAttribute( 'pSize', new Float32BufferAttribute( this.pointSizes, 1 ) );

		this.instanceData = null;

	}

	resetDistances () {

		this.vertices.forEach( node => { if ( node ) node.shortestPath = Infinity; } );

	}

	setSplaysVisibility ( visible ) {

		this.splaysVisible = visible;
		const splaySize = visible ? 6.0 : 0.0;

		const vertices = this.vertices;
		const pSize = this.geometry.getAttribute( 'pSize' );
		const l = vertices.length;
		const selection = this.selection;

		for ( let i = 0; i < l; i++ ) {

			const node = vertices[ i ];

			if ( node.connections === 0 && ( splaySize === 0 || selection.contains( node.id ) ) ) {

				pSize.setX( i, splaySize );

			}

		}

		pSize.needsUpdate = true;
	}

}

export { Stations };