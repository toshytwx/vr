attribute vec3 aPosition;
// attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
// uniform mat4 uNormalMatrix;
// uniform vec3 uLightDirection;

// uniform vec3 uViewPosition;
// uniform vec3 uAmbientColor;
// uniform vec3 uDiffuseColor;
// uniform vec3 uSpecularColor;
// uniform float uShininess;

// varying vec3 vColor;

void main() {
    // vec3 transformedNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
    
    // vec3 fragPosition = (uModelViewMatrix * vec4(aPosition, 1.0)).xyz;
    // vec3 lightDir = normalize(uLightDirection - fragPosition);
    // vec3 viewDir = normalize(uViewPosition - fragPosition);

    // vec3 ambient = uAmbientColor;
    // float diff = max(dot(transformedNormal, lightDir), 0.0);
    // vec3 diffuse = uDiffuseColor * diff;

    // vec3 reflectDir = reflect(-lightDir, transformedNormal);
    // float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    // vec3 specular = uSpecularColor * spec;

    // vColor = (ambient + diffuse + specular) * vec3(1.0, 0.6, 0.3);
    // vColor = vec3(1.0, 0.6, 0.3);


    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
