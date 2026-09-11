(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,91346,e=>{"use strict";let t,i;var n=e.i(43476),r=e.i(71645),o=e.i(75056),a=e.i(94800);function s(){return(s=Object.assign.bind()).apply(null,arguments)}var l=e.i(32009),d=e.i(70950),d=d,c=l,f=l;let u=new f.Box3,p=new f.Vector3;class h extends f.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new f.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new f.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new f.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new f.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new f.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let n=new f.InstancedInterleavedBuffer(i,2*t,1);return this.setAttribute("instanceColorStart",new f.InterleavedBufferAttribute(n,t,0)),this.setAttribute("instanceColorEnd",new f.InterleavedBufferAttribute(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new f.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new f.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),u.setFromBufferAttribute(t),this.boundingBox.union(u))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new f.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let r=0,o=e.count;r<o;r++)p.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(p)),p.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(p));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var m=l;let v=parseInt(l.REVISION.replace(/\D+/g,""));class y extends m.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:m.UniformsUtils.clone(m.UniformsUtils.merge([m.UniformsLib.common,m.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new m.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${v>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let g=v>=125?"uv1":"uv2",w=new c.Vector4,S=new c.Vector3,x=new c.Vector3,b=new c.Vector4,E=new c.Vector4,A=new c.Vector4,_=new c.Vector3,L=new c.Matrix4,M=new c.Line3,U=new c.Vector3,z=new c.Box3,B=new c.Sphere,C=new c.Vector4;function O(e,t,n){return C.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),C.multiplyScalar(1/C.w),C.x=i/n.width,C.y=i/n.height,C.applyMatrix4(e.projectionMatrixInverse),C.multiplyScalar(1/C.w),Math.abs(Math.max(C.x,C.y))}class P extends c.Mesh{constructor(e=new h,t=new y({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,o=t.count;e<o;e++,r+=2)S.fromBufferAttribute(t,e),x.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+S.distanceTo(x);let r=new c.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new c.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new c.InterleavedBufferAttribute(r,1,1)),this}raycast(e,n){let r,o,a=this.material.worldUnits,s=e.camera;null!==s||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let d=this.matrixWorld,f=this.geometry,u=this.material;if(i=u.linewidth+l,null===f.boundingSphere&&f.computeBoundingSphere(),B.copy(f.boundingSphere).applyMatrix4(d),a)r=.5*i;else{let e=Math.max(s.near,B.distanceToPoint(t.origin));r=O(s,e,u.resolution)}if(B.radius+=r,!1!==t.intersectsSphere(B)){if(null===f.boundingBox&&f.computeBoundingBox(),z.copy(f.boundingBox).applyMatrix4(d),a)o=.5*i;else{let e=Math.max(s.near,z.distanceToPoint(t.origin));o=O(s,e,u.resolution)}z.expandByScalar(o),!1!==t.intersectsBox(z)&&(a?function(e,n){let r=e.matrixWorld,o=e.geometry,a=o.attributes.instanceStart,s=o.attributes.instanceEnd,l=Math.min(o.instanceCount,a.count);for(let o=0;o<l;o++){M.start.fromBufferAttribute(a,o),M.end.fromBufferAttribute(s,o),M.applyMatrix4(r);let l=new c.Vector3,d=new c.Vector3;t.distanceSqToSegment(M.start,M.end,d,l),d.distanceTo(l)<.5*i&&n.push({point:d,pointOnLine:l,distance:t.origin.distanceTo(d),object:e,face:null,faceIndex:o,uv:null,[g]:null})}}(this,n):function(e,n,r){let o=n.projectionMatrix,a=e.material.resolution,s=e.matrixWorld,l=e.geometry,d=l.attributes.instanceStart,f=l.attributes.instanceEnd,u=Math.min(l.instanceCount,d.count),p=-n.near;t.at(1,A),A.w=1,A.applyMatrix4(n.matrixWorldInverse),A.applyMatrix4(o),A.multiplyScalar(1/A.w),A.x*=a.x/2,A.y*=a.y/2,A.z=0,_.copy(A),L.multiplyMatrices(n.matrixWorldInverse,s);for(let n=0;n<u;n++){if(b.fromBufferAttribute(d,n),E.fromBufferAttribute(f,n),b.w=1,E.w=1,b.applyMatrix4(L),E.applyMatrix4(L),b.z>p&&E.z>p)continue;if(b.z>p){let e=b.z-E.z,t=(b.z-p)/e;b.lerp(E,t)}else if(E.z>p){let e=E.z-b.z,t=(E.z-p)/e;E.lerp(b,t)}b.applyMatrix4(o),E.applyMatrix4(o),b.multiplyScalar(1/b.w),E.multiplyScalar(1/E.w),b.x*=a.x/2,b.y*=a.y/2,E.x*=a.x/2,E.y*=a.y/2,M.start.copy(b),M.start.z=0,M.end.copy(E),M.end.z=0;let l=M.closestPointToPointParameter(_,!0);M.at(l,U);let u=c.MathUtils.lerp(b.z,E.z,l),h=u>=-1&&u<=1,m=_.distanceTo(U)<.5*i;if(h&&m){M.start.fromBufferAttribute(d,n),M.end.fromBufferAttribute(f,n),M.start.applyMatrix4(s),M.end.applyMatrix4(s);let i=new c.Vector3,o=new c.Vector3;t.distanceSqToSegment(M.start,M.end,o,i),r.push({point:o,pointOnLine:i,distance:t.origin.distanceTo(o),object:e,face:null,faceIndex:n,uv:null,[g]:null})}}}(this,s,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(w),this.material.uniforms.resolution.value.set(w.z,w.w))}}class D extends h{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,n=new Float32Array(2*i);if(3===t)for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];else for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5],n[2*r+6]=e[r+6],n[2*r+7]=e[r+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class I extends P{constructor(e=new D,t=new y({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let j=r.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:n,lineWidth:o,segments:a,dashed:c,...f},u){var p,m;let v=(0,d.C)(e=>e.size),g=r.useMemo(()=>a?new P:new I,[a]),[w]=r.useState(()=>new y),S=(null==i||null==(p=i[0])?void 0:p.length)===4?4:3,x=r.useMemo(()=>{let n=a?new h:new D,r=e.map(e=>{let t=Array.isArray(e);return e instanceof l.Vector3||e instanceof l.Vector4?[e.x,e.y,e.z]:e instanceof l.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(r.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof l.Color?e.toArray():e);n.setColors(e.flat(),S)}return n},[e,a,i,S]);return r.useLayoutEffect(()=>{g.computeLineDistances()},[e,g]),r.useLayoutEffect(()=>{c?w.defines.USE_DASH="":delete w.defines.USE_DASH,w.needsUpdate=!0},[c,w]),r.useEffect(()=>()=>{x.dispose(),w.dispose()},[x]),r.createElement("primitive",s({object:g,ref:u},f),r.createElement("primitive",{object:x,attach:"geometry"}),r.createElement("primitive",s({object:w,attach:"material",color:t,vertexColors:!!i,resolution:[v.width,v.height],linewidth:null!=(m=null!=n?n:o)?m:1,dashed:c,transparent:4===S},f)))});var R=l;let T=parseInt(l.REVISION.replace(/\D+/g,""));class V extends R.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,fragmentShader:`
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <${T>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}let H=e=>new R.Vector3().setFromSpherical(new R.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),N=r.forwardRef(({radius:e=100,depth:t=50,count:i=5e3,saturation:n=0,factor:o=4,fade:s=!1,speed:l=1},d)=>{let c=r.useRef(null),[f,u,p]=r.useMemo(()=>{let r=[],a=[],s=Array.from({length:i},()=>(.5+.5*Math.random())*o),l=new R.Color,d=e+t,c=t/i;for(let e=0;e<i;e++)d-=c*Math.random(),r.push(...H(d).toArray()),l.setHSL(e/i,n,.9),a.push(l.r,l.g,l.b);return[new Float32Array(r),new Float32Array(a),new Float32Array(s)]},[i,t,o,e,n]);(0,a.useFrame)(e=>c.current&&(c.current.uniforms.time.value=e.clock.elapsedTime*l));let[h]=r.useState(()=>new V);return r.createElement("points",{ref:d},r.createElement("bufferGeometry",null,r.createElement("bufferAttribute",{attach:"attributes-position",args:[f,3]}),r.createElement("bufferAttribute",{attach:"attributes-color",args:[u,3]}),r.createElement("bufferAttribute",{attach:"attributes-size",args:[p,1]})),r.createElement("primitive",{ref:c,object:h,attach:"material",blending:R.AdditiveBlending,"uniforms-fade-value":s,depthWrite:!1,transparent:!0,vertexColors:!0}))});function F({strandA:e,strandB:t}){let i=(0,r.useRef)(null),o=Math.floor(e.length/6);return(0,r.useEffect)(()=>{if(!i.current)return;let n=new l.Object3D;for(let r=0;r<o;r++){let o=e[6*r],a=t[6*r],s=o.clone().add(a).multiplyScalar(.5),d=a.clone().sub(o),c=d.length();n.position.copy(s),n.scale.set(1,c,1),n.quaternion.setFromUnitVectors(new l.Vector3(0,1,0),d.clone().normalize()),n.updateMatrix(),i.current.setMatrixAt(r,n.matrix)}i.current.instanceMatrix.needsUpdate=!0},[o,e,t]),(0,n.jsxs)("instancedMesh",{ref:i,args:[void 0,void 0,o],children:[(0,n.jsx)("cylinderGeometry",{args:[.018,.018,1,6]}),(0,n.jsx)("meshStandardMaterial",{color:"#8fb4c9",emissive:"#22d3ee",emissiveIntensity:.15,roughness:.5})]})}function W({pointer:e,scroll:t}){let i=(0,r.useRef)(null),{strandA:o,strandB:s}=(0,r.useMemo)(()=>{let e=[],t=[];for(let i=0;i<=288;i++){let n=i/288*6*Math.PI*2,r=i/288*9-4.5;e.push(new l.Vector3(1.6*Math.cos(n),r,1.6*Math.sin(n))),t.push(new l.Vector3(1.6*Math.cos(n+Math.PI),r,1.6*Math.sin(n+Math.PI)))}return{strandA:e,strandB:t}},[]);return(0,a.useFrame)((n,r)=>{if(!i.current)return;t.current,i.current.rotation.y+=.12*r;let o=.35*e.current.y;i.current.rotation.x+=(o-i.current.rotation.x)*.04,i.current.rotation.z+=(.2*e.current.x-i.current.rotation.z)*.04,i.current.position.y=-(.0015*t.current)}),(0,n.jsxs)("group",{ref:i,children:[(0,n.jsx)(j,{points:o,color:"#22d3ee",lineWidth:2.2}),(0,n.jsx)(j,{points:s,color:"#a78bfa",lineWidth:2.2}),(0,n.jsx)(F,{strandA:o,strandB:s})]})}e.s(["default",0,function(){let e=(0,r.useRef)({x:0,y:0}),t=(0,r.useRef)(0);return(0,r.useEffect)(()=>{function i(){t.current=window.scrollY}function n(t){e.current={x:t.clientX/window.innerWidth*2-1,y:t.clientY/window.innerHeight*2-1}}return i(),window.addEventListener("scroll",i,{passive:!0}),window.addEventListener("pointermove",n,{passive:!0}),()=>{window.removeEventListener("scroll",i),window.removeEventListener("pointermove",n)}},[]),(0,n.jsx)("div",{className:"absolute inset-0",children:(0,n.jsxs)(o.Canvas,{camera:{position:[0,0,8.5],fov:45},dpr:[1,1.75],gl:{antialias:!0,alpha:!0},children:[(0,n.jsx)("ambientLight",{intensity:.55}),(0,n.jsx)("pointLight",{position:[5,5,5],intensity:40,color:"#22d3ee"}),(0,n.jsx)("pointLight",{position:[-5,-3,-5],intensity:30,color:"#a78bfa"}),(0,n.jsx)(N,{radius:40,depth:30,count:1200,factor:2,fade:!0,speed:.4}),(0,n.jsx)(W,{pointer:e,scroll:t})]})})}],91346)},85470,function(e){e.n(e.i(91346))}]);