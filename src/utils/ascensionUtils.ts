export function getAscensionTexturePath(baseTexture: 'Pets' | 'MountIcons' | 'SkillIcons' | 'Eggs' | 'Icons', ascensionLevel: number, version?: string): string {
    const baseUrl = import.meta.env.BASE_URL;
    const versionPath = version ? `${version}/` : '';
    const textureBase = `${baseUrl}Texture2D/${versionPath}`;
    
    // Icons sheet doesn't have ascended versions, always return standard
    if (baseTexture === 'Icons') return `${textureBase}Icons.png`;

    if (ascensionLevel === 1) return `${textureBase}Mega${baseTexture}.png`;
    if (ascensionLevel === 2) return `${textureBase}Ultra${baseTexture}.png`;
    if (ascensionLevel === 3) return `${textureBase}Apex${baseTexture}.png`;
    
    return `${textureBase}${baseTexture}.png`;
}

export function getAnvilTexturePath(ascensionLevel: number, version?: string): string {
    const baseUrl = import.meta.env.BASE_URL;
    const versionPath = version ? `${version}/` : '';
    const textureBase = `${baseUrl}Texture2D/${versionPath}`;

    if (ascensionLevel === 1) return `${textureBase}Anvil _.png`;
    if (ascensionLevel === 2) return `${textureBase}Anvil __.png`;
    if (ascensionLevel === 3) return `${textureBase}Anvil ___.png`;
    
    return `${textureBase}Anvil.png`;
}
