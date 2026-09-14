varying vec2 vUv;

float V(float v) {

    return v / 255.0;

}


float thickLine(float y, float radius, float offset, float width) {

    float edge = y - (offset * width);
    return step(edge - width, radius) - step(edge, radius);

}

void main() {
    
    vec3 red = vec3(V(200.0), V(69.0), V(87.0));
    vec3 orange = vec3(V(249.0), V(100.0), V(45.0));
    vec3 yellow = vec3(V(255.0), V(166.0), V(52.0));
    vec3 green = vec3(V(168.0), V(182.0), V(101.0));
    vec3 blue = vec3(V(45.0), V(112.0), V(171.0));
    vec3 indigo = vec3(V(106.0), V(136.0), V(184.0));
    vec3 violet = vec3(V(167.0), V(131.0), V(181.0));



    float radius = distance(vUv, vec2(0.5, 0.5)) * 2.0;

    float ratio = 0.4; //if innerRadius is 3 and outerRadius is 5: ratio = 3.0 / 5.0 = 0.6
    float stretchedRadius = (radius - ratio) / (1.0 - ratio);

    float width = (1.0 / 7.0);
    float y = 1.0;

    vec3 color = mix(red, orange, thickLine(y, stretchedRadius, 1.0, width));
    color = mix(color, yellow, thickLine(y, stretchedRadius, 2.0, width));
    color = mix(color, green, thickLine(y, stretchedRadius, 3.0, width));
    color = mix(color, blue, thickLine(y, stretchedRadius, 4.0, width));
    color = mix(color, indigo, thickLine(y, stretchedRadius, 5.0, width));
    color = mix(color, violet, thickLine(y, stretchedRadius, 6.0, width));

    float z = smoothstep(1.0, 0.99, stretchedRadius);
  
    gl_FragColor = vec4(color, z);

}