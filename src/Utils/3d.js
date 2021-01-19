function add(v1,v2) {
	return v1.map((c,i) => c+v2[i]);
}
function sub(v1,v2) {
	return v1.map((c,i) => c-v2[i]);
}
function mul(v1,v2) {
	return v1.map((c,i) => c*v2[i]);
}
function scale(v,s) {
	return v.map(c => c*s);
}
function dot(v1,v2) {
	return v1.reduce((s,c,i) => s+c*v2[i],0);
}
function transpose(m) {
	return m.map((row,r) => row.map((col,c) => m[c][r]));
}
function matmul(m,v) {
	return v.map((d,i) => dot(v,m[i]));
}
function project(v,z=1,d=0) {
	return [z*v[0]/(v[2]+d),z*v[1]/(v[2]+d),v[2]+d];
}
function projectOrtho(v,z=1,d=0) {
	return [z*v[0],z*v[1],v[2]+d];
}
function vert(x,y,z=0,u=0,v=0) {
	return [[x,y,z],[u,v]];
}

class ThreeDee {
	constructor(opts = {}) {
		this.fov      = opts.fov || 90;
		this.distance = opts.distance || 2;
		this.yaw      = 0;
		this.pitch    = 0;
		this.matrix   = [[1,0,0],[0,1,0],[0,0,1]];
		this.width    = 200;
		this.height   = 150;
	}
	static createMatrix(yaw=0,pitch=0,transposed=false) {
		let sinY = Math.sin(yaw);
		let cosY = Math.cos(yaw);
		let sinP = Math.sin(pitch);
		let cosP = Math.cos(pitch);
		let mat = [
			[cosY,0,-sinY],
			[sinY*-sinP,cosP,cosY*-sinP],
			[sinY*cosP,sinP,cosY*cosP]
		];
		if (transposed) mat = transpose(mat);
		return mat;
	}
	static transform(v,m) {
		return matmul(m,v);
	}
	static project(v, opts = {}) {
		if (opts.ortho) {
			return projectOrtho(v,Math.tan(Math.PI*(opts.fov||90)/360),opts.distance||0);
		} else {
			return project(v,Math.tan(Math.PI*(opts.fov||90)/360),opts.distance||0);
		}
	}
}

class Geometry {
	constructor(data = {}) {
		this.verts   = data.verts || [];
		this.uvs     = data.uvs   || [];
		this.tris    = data.tris  || [];
		this.texture = data.texture || null;
	}
	scale(s=1) {
		this.verts.forEach((v,i) => {
			this.verts[i] = scale(v,s);
		});
		return this;
	}
	prerender(matrix, opts = {}) {
		// transform all verts to plane of projection
		let verts = this.verts.map(v => {
			v = matmul(matrix, v);
			if (opts.ortho) {
				v = projectOrtho(v, opts.zoom, opts.distance);
			} else {
				v = project(v, opts.zoom, opts.distance);
			}
			// align point within an image coordinate system
			if (opts.width && opts.height) {
				v = [v[0]+opts.width/2,opts.height/2-v[1], v[2]];
			}
			return v;
		});
		let uvs = this.uvs;
		let tris = this.tris
		// calculate average tri z distances
		.map((tri,tIdx) => [tIdx,tri[0].reduce((sum,vi)=>sum+verts[vi][2],0)/3])
		// filter out tris behind frustrum
		.filter(([tIdx,tZ]) => tZ > 0.005)
		// sort tris from farthest to closest
		.sort((z1,z2) => z1[1] < z2[1] ? 1 : z1[1] > z2[1] ? -1 : 0)
		// collect sorted tris
		.map(([tIdx,tZ]) => this.tris[tIdx])
		// build raw geometry
		.map(([vIdxs,uvIdxs]) => [vIdxs.map(i => verts[i]),uvIdxs.map(i => uvs[i])]);
		if (opts.perspectiveCorrection) {
			// TODO: fix distortion from affine scan rendering.
			for (let tri of tris) {
				
			}
		}
		//return {verts,uvs,tris};
		//console.log(JSON.stringify(opts));
		//console.log(JSON.stringify(tris));
		return tris;
	}
	static makePlane(width = 100, height = 100) {
		return new Geometry({
			verts: [
				[-width/2,-height/2,0],
				[ width/2,-height/2,0],
				[-width/2, height/2,0],
				[ width/2, height/2,0]
			],
			uvs: [
				[0,0],
				[1,0],
				[0,1],
				[1,1]
			],
			tris: [
				[[0,1,3],[2,3,1]],
				[[0,2,3],[2,0,1]]
			]
		});
	}
	static makeCube(size = 100) {
		let geo = new Geometry({
			verts: [
				[-0.5,-0.5,-0.5],
				[ 0.5,-0.5,-0.5],
				[-0.5, 0.5,-0.5],
				[ 0.5, 0.5,-0.5],
				[-0.5,-0.5, 0.5],
				[ 0.5,-0.5, 0.5],
				[-0.5, 0.5, 0.5],
				[ 0.5, 0.5, 0.5]
			],
			uvs: [
				[0,0],
				[1,0],
				[0,1],
				[1,1]
			],
			tris: [
				// front side
				[[0,1,3],[2,3,1]],
				[[0,2,3],[2,0,1]],
				// back side
				[[5,4,6],[2,3,1]],
				[[5,7,6],[2,0,1]],
				// left side
				[[4,0,2],[2,3,1]],
				[[4,6,2],[2,0,1]],
				// right side
				[[1,5,7],[2,3,1]],
				[[1,3,7],[2,0,1]],
				// bottom side
				[[4,5,1],[2,3,1]],
				[[4,0,1],[2,0,1]],
				// top side
				[[2,3,7],[2,3,1]],
				[[2,6,7],[2,0,1]]
			]
		});
		return geo.scale(size);
	}
	static makePyramid(size = 100) {
		let geo = new Geometry({
			verts: [
				[-0.5,-0.5,-0.5],
				[ 0.5,-0.5,-0.5],
				[-0.5,-0.5, 0.5],
				[ 0.5,-0.5, 0.5],
				[0,0.5,0]
			],
			uvs: [
				[0,0],
				[1,0],
				[0,1],
				[1,1],
				[0.5,0]
			],
			tris: [
				[[0,1,3],[0,1,3]],
				[[0,2,3],[0,2,3]],
				[[0,1,4],[2,3,4]],
				[[1,3,4],[2,3,4]],
				[[3,2,4],[2,3,4]],
				[[2,0,4],[2,3,4]]
			]
		});
		return geo.scale(size);
	}
	// data from https://people.sc.fsu.edu/~jburkardt/data/obj/icosahedron.obj
	static makeIcosahedron(size = 100) {
		let geo = new Geometry({
			verts: [
				[0,-0.525731,0.850651],
				[0.850651,0,0.525731],
				[0.850651,0,-0.525731],
				[-0.850651,0,-0.525731],
				[-0.850651,0,0.525731],
				[-0.525731,0.850651,0],
				[0.525731,0.850651,0],
				[0.525731,-0.850651,0],
				[-0.525731,-0.850651,0],
				[0,-0.525731,-0.850651],
				[0,0.525731,-0.850651],
				[0,0.525731,0.850651]
			],
			uvs: [
				[0,0],
				[0.5,0],
				[1,0],
				[0,1],
				[0.5,1],
				[1,1]
			],
			tris: [
				[[1,2,6],[0,4,2]],
				[[1,7,2],[1,3,5]],
				[[3,4,5],[0,4,2]],
				[[4,3,8],[1,3,5]],
				[[6,5,11],[0,4,2]],
				[[5,6,10],[1,3,5]],
				[[9,10,2],[0,4,2]],
				[[10,9,3],[1,3,5]],
				[[7,8,9],[0,4,2]],
				[[8,7,0],[1,3,5]],
				[[11,0,1],[0,4,2]],
				[[0,11,4],[1,3,5]],
				[[6,2,10],[0,4,2]],
				[[1,6,11],[1,3,5]],
				[[3,5,10],[0,4,2]],
				[[5,4,11],[1,3,5]],
				[[2,7,9],[0,4,2]],
				[[7,1,0],[1,3,5]],
				[[3,9,8],[0,4,2]],
				[[4,8,0],[1,3,5]]
			]
		});
		return geo.scale(size);
	}
	// data from https://people.sc.fsu.edu/~jburkardt/data/obj/dodecahedron.obj
	static makeDodecahedron(size = 100) {
		let uvs = [];
		for (let t = 0, r; t < 5; t++) {
			r = 2 * Math.PI * t/5;
			uvs.push([0.5+0.5*Math.sin(r),0.5-0.5*Math.cos(r)]);
		}
		let geo = new Geometry({
			verts: [
				[-0.57735,-0.57735,0.57735],
				[0.934172,0.356822,0],
				[0.934172,-0.356822,0],
				[-0.934172,0.356822,0],
				[-0.934172,-0.356822,0],
				[0,0.934172,0.356822],
				[0,0.934172,-0.356822],
				[0.356822,0,-0.934172],
				[-0.356822,0,-0.934172],
				[0,-0.934172,-0.356822],
				[0,-0.934172,0.356822],
				[0.356822,0,0.934172],
				[-0.356822,0,0.934172],
				[0.57735,0.57735,-0.57735],
				[0.57735,0.57735,0.57735],
				[-0.57735,0.57735,-0.57735],
				[-0.57735,0.57735,0.57735],
				[0.57735,-0.57735,-0.57735],
				[0.57735,-0.57735,0.57735],
				[-0.57735,-0.57735,-0.57735]
			],
			uvs: uvs,
			tris: [
				[[18,2,1],[3,4,0]],
				[[11,18,1],[2,3,0]],
				[[14,11,1],[1,2,0]],
				[[7,13,1],[3,4,0]],
				[[17,7,1],[2,3,0]],
				[[2,17,1],[1,2,0]],
				[[19,4,3],[3,4,0]],
				[[8,19,3],[2,3,0]],
				[[15,8,3],[1,2,0]],
				[[12,16,3],[3,4,0]],
				[[0,12,3],[2,3,0]],
				[[4,0,3],[1,2,0]],
				[[6,15,3],[3,4,0]],
				[[5,6,3],[2,3,0]],
				[[16,5,3],[1,2,0]],
				[[5,14,1],[3,4,0]],
				[[6,5,1],[2,3,0]],
				[[13,6,1],[1,2,0]],
				[[9,17,2],[3,4,0]],
				[[10,9,2],[2,3,0]],
				[[18,10,2],[1,2,0]],
				[[10,0,4],[3,4,0]],
				[[9,10,4],[2,3,0]],
				[[19,9,4],[1,2,0]],
				[[19,8,7],[3,4,0]],
				[[9,19,7],[2,3,0]],
				[[17,9,7],[1,2,0]],
				[[8,15,6],[3,4,0]],
				[[7,8,6],[2,3,0]],
				[[13,7,6],[1,2,0]],
				[[11,14,5],[3,4,0]],
				[[12,11,5],[2,3,0]],
				[[16,12,5],[1,2,0]],
				[[12,0,10],[3,4,0]],
				[[11,12,10],[2,3,0]],
				[[18,11,10],[1,2,0]]
			]
		});
		return geo.scale(size);
	}
	static makeSphere(diameter = 100, quality = 20) {
		throw 'TODO!';
		let rad = diameter / 2;
		let geo = new Geometry();
		for (let v = 0, phi; v <= quality/2; v++) {
			phi = (0.5-2*v/quality) * Math.PI;
			for (let u = 0, theta; u <= quality; u++) {
				theta = u/quality * Math.PI;
				geo.verts.push([rad*Math.sin(theta)*Math.cos(phi),Math.sin(phi),Math.cos(theta)*Math.cos(phi)]);
				geo.uvs.push([u/quality,2*v/quality]);
				geo.tris.push([[],[]]);
				geo.tris.push([[],[]]);
			}
		}
		return geo;
	}
}

const ThreeDeeUtils = {add,sub,mul,scale,dot,transpose,project,projectOrtho,vert};
//Object.assign(ThreeDee,ThreeDeeUtils);

module.exports = {
	ThreeDee,
	ThreeDeeUtils,
	Geometry
};
