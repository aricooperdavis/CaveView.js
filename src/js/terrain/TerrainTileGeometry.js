/**
 * @author Angus Sawyer
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

import { Box3 } from 'three/src/math/Box3.js';
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { Vector3 } from 'three/src/math/Vector3.js';

class TerrainTileGeometry extends BufferGeometry {

	constructor ( width, height, widthSegments, heightSegments, terrainData, scale, clip, offsets ) {

		super();

		this.type = 'TerrainTileGeometry';

		const gridX = widthSegments;
		const gridY = heightSegments;

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = width / gridX;
		const segment_height = height / gridY;

		// buffers

		const indices = [];
		const vertices = [];
		const uvs = [];


		let minZ = Infinity;
		let maxZ = -Infinity;

		// generate vertices and uvs

		if ( clip.dtmWidth === undefined ) {

			clip.dtmWidth = clip.terrainWidth + 1;

		}

		const ixMax = gridX1 + clip.left;
		const iyMax = gridY1 + clip.top;

		const zOffset = offsets.z;
		const xOffset = offsets.x;

		let zIndex;

		let x;
		let y = offsets.y;

		for ( let iy = clip.top; iy < iyMax; iy++ ) {

			x = xOffset;

			// dtmOffset adjusts for tiles smaller than DTM height maps

			zIndex = iy * clip.dtmWidth + clip.left + clip.dtmOffset;

			for ( let ix = clip.left; ix < ixMax; ix++ ) {

				const z = terrainData[ zIndex++ ] / scale - zOffset; // scale and convert to origin centered coords

				vertices.push( x, y, z );

				if ( z < minZ ) minZ = z;
				if ( z > maxZ ) maxZ = z;

				uvs.push( ix / clip.terrainWidth );
				uvs.push( 1 - ( iy / clip.terrainHeight ) );

				x += segment_width;

			}

			y -= segment_height;

		}

		// avoid overhead of computeBoundingBox since we know x & y min and max values;

		this.boundingBox = new Box3( new Vector3( offsets.x, offsets.y - height, minZ ), new Vector3( offsets.x + width, offsets.y, maxZ ) );

		// indices

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;

				// faces - render each quad such that the shared diagonal edge has the minimum length - gives a smother terrain surface
				// diagonals b - d, a - c

				const d1 = Math.abs( vertices[ a * 3 + 2 ] - vertices[ d * 3 + 2 ] ); // diff in Z values between diagonal vertices
				const d2 = Math.abs( vertices[ b * 3 + 2 ] - vertices[ c * 3 + 2 ] ); // diff in Z values between diagonal vertices

				if ( d1 < d2 ) {

					indices.push( a, b, d );
					indices.push( b, c, d );

				} else {

					indices.push( a, b, c );
					indices.push( c, d, a );

				}

			}

		}

		// build geometry

		this.setIndex( indices );
		this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

		this.computeVertexNormals();

	}

}

export { TerrainTileGeometry };