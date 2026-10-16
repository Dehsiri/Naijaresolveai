import * as THREE from 'three';
import { AvatarConfig } from '../../types/avatar';

export interface AvatarRig {
  root: THREE.Group;
  pedestal: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  sunglassesMesh?: THREE.Object3D;
  goldChainMesh?: THREE.Object3D;
  coralBeadsMesh?: THREE.Object3D;
  update: (delta: number, time: number, pose: string, energy: number) => void;
  dispose: () => void;
}

export function build3DAvatar(
  config: AvatarConfig,
  options?: { showPedestal?: boolean }
): AvatarRig {
  const root = new THREE.Group();

  // Materials Cache
  const materialsToDispose: THREE.Material[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  function makeMat(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial(params);
    materialsToDispose.push(mat);
    return mat;
  }

  function makeGeom<T extends THREE.BufferGeometry>(geom: T): T {
    geometriesToDispose.push(geom);
    return geom;
  }

  // Common Palettes
  const skinColor = new THREE.Color(config.skinTone || '#5e3829');
  const outfitColor = new THREE.Color(config.outfitColor || '#0d5c3a');
  const accentColor = new THREE.Color(config.accentColor || '#f59e0b');
  const hairColor = new THREE.Color(config.hairColor || '#111827');
  const goldColor = new THREE.Color('#f59e0b');
  const coralColor = new THREE.Color('#e11d48');
  const darkFabColor = new THREE.Color('#1e293b');
  const shoeColor = new THREE.Color(config.gender === 'male' ? '#0f172a' : '#451a03');

  // Materials
  const skinMat = makeMat({
    color: skinColor,
    roughness: 0.6,
    metalness: 0.05,
  });

  const outfitMat = makeMat({
    color: outfitColor,
    roughness: 0.7,
    metalness: 0.1,
  });

  const accentMat = makeMat({
    color: accentColor,
    roughness: 0.5,
    metalness: 0.25,
  });

  const pantsMat = makeMat({
    color: config.outfitStyle === 'owambe' ? outfitColor : darkFabColor,
    roughness: 0.75,
    metalness: 0.05,
  });

  const hairMat = makeMat({
    color: hairColor,
    roughness: 0.85,
    metalness: 0.05,
  });

  const goldMat = makeMat({
    color: goldColor,
    metalness: 0.9,
    roughness: 0.2,
  });

  const coralMat = makeMat({
    color: coralColor,
    roughness: 0.35,
    metalness: 0.15,
  });

  const eyeWhiteMat = makeMat({ color: 0xffffff, roughness: 0.2 });
  const eyePupilMat = makeMat({ color: 0x1a0f0a, roughness: 0.1 });
  const lipsMat = makeMat({
    color: skinColor.clone().multiplyScalar(0.75).add(new THREE.Color('#3a0e14')),
    roughness: 0.4,
  });

  // 1. Pedestal / Turntable Stage
  const pedestal = new THREE.Group();
  const baseCylinder = new THREE.Mesh(
    makeGeom(new THREE.CylinderGeometry(0.7, 0.75, 0.08, 36)),
    makeMat({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 })
  );
  baseCylinder.position.y = -0.04;
  pedestal.add(baseCylinder);

  const glowRing = new THREE.Mesh(
    makeGeom(new THREE.TorusGeometry(0.72, 0.02, 16, 48)),
    makeMat({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    })
  );
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 0.002;
  pedestal.add(glowRing);

  pedestal.visible = options?.showPedestal ?? true;
  root.add(pedestal);

  // 2. Body Hierarchy
  const body = new THREE.Group();
  root.add(body);

  const isMale = config.gender === 'male';

  // Torso / Chest
  const torso = new THREE.Group();
  torso.position.y = 0.88;
  body.add(torso);

  const chestWidth = isMale ? 0.38 : 0.32;
  const chestHeight = 0.42;
  const chestDepth = isMale ? 0.24 : 0.21;

  const chestMesh = new THREE.Mesh(
    makeGeom(new THREE.BoxGeometry(chestWidth, chestHeight, chestDepth)),
    outfitMat
  );
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Outfit Embroidery / Front Stripe / Peplum
  if (config.outfitStyle === 'senator' || isMale) {
    // Senator vertical embroidery strip down center
    const strip = new THREE.Mesh(
      makeGeom(new THREE.BoxGeometry(0.08, chestHeight * 1.1, chestDepth + 0.01)),
      accentMat
    );
    torso.add(strip);

    // Tunic tail (Senator tunic hangs past waist)
    const tunicTail = new THREE.Mesh(
      makeGeom(new THREE.BoxGeometry(chestWidth * 1.02, 0.26, chestDepth * 1.02)),
      outfitMat
    );
    tunicTail.position.y = -chestHeight * 0.6;
    torso.add(tunicTail);
  } else if (config.outfitStyle === 'ankara' && !isMale) {
    // Ankara Peplum ruffle flare
    const peplumGeom = makeGeom(new THREE.CylinderGeometry(0.18, 0.28, 0.16, 24));
    const peplumMesh = new THREE.Mesh(peplumGeom, outfitMat);
    peplumMesh.position.y = -chestHeight * 0.48;
    torso.add(peplumMesh);

    // Decorative Ankara waistband
    const waistBand = new THREE.Mesh(
      makeGeom(new THREE.BoxGeometry(chestWidth * 1.02, 0.05, chestDepth * 1.02)),
      accentMat
    );
    waistBand.position.y = -chestHeight * 0.38;
    torso.add(waistBand);
  } else if (config.outfitStyle === 'owambe') {
    // Owambe Shawl / Agbada shoulders drape
    const capeGeom = makeGeom(new THREE.BoxGeometry(chestWidth * 1.45, 0.36, chestDepth * 1.2));
    const capeMesh = new THREE.Mesh(capeGeom, outfitMat);
    capeMesh.position.y = 0.02;
    torso.add(capeMesh);

    const goldBorder = new THREE.Mesh(
      makeGeom(new THREE.BoxGeometry(chestWidth * 1.46, 0.04, chestDepth * 1.22)),
      accentMat
    );
    goldBorder.position.y = -0.16;
    torso.add(goldBorder);
  }

  // Neck
  const neckGeom = makeGeom(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 16));
  const neckMesh = new THREE.Mesh(neckGeom, skinMat);
  neckMesh.position.y = chestHeight * 0.5 + 0.04;
  torso.add(neckMesh);

  // Head Group
  const head = new THREE.Group();
  head.position.y = chestHeight * 0.5 + 0.24;
  torso.add(head);

  // Head Base
  const headWidth = 0.26;
  const headHeight = 0.29;
  const headDepth = 0.27;
  const headMesh = new THREE.Mesh(
    makeGeom(new THREE.BoxGeometry(headWidth, headHeight, headDepth)),
    skinMat
  );
  headMesh.castShadow = true;
  head.add(headMesh);

  // Face Features (Eyes, Eyebrows, Smile, Ears)
  const eyeGeom = makeGeom(new THREE.SphereGeometry(0.032, 16, 16));
  const pupilGeom = makeGeom(new THREE.SphereGeometry(0.018, 16, 16));

  // Left Eye
  const leftEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  leftEyeWhite.position.set(-0.068, 0.02, headDepth * 0.5);
  leftEyeWhite.scale.set(1, 0.8, 0.4);
  head.add(leftEyeWhite);

  const leftPupil = new THREE.Mesh(pupilGeom, eyePupilMat);
  leftPupil.position.set(-0.068, 0.02, headDepth * 0.5 + 0.015);
  head.add(leftPupil);

  // Right Eye
  const rightEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  rightEyeWhite.position.set(0.068, 0.02, headDepth * 0.5);
  rightEyeWhite.scale.set(1, 0.8, 0.4);
  head.add(rightEyeWhite);

  const rightPupil = new THREE.Mesh(pupilGeom, eyePupilMat);
  rightPupil.position.set(0.068, 0.02, headDepth * 0.5 + 0.015);
  head.add(rightPupil);

  // Eyebrows
  const browGeom = makeGeom(new THREE.BoxGeometry(0.07, 0.016, 0.02));
  const leftBrow = new THREE.Mesh(browGeom, hairMat);
  leftBrow.position.set(-0.068, 0.06, headDepth * 0.5 + 0.01);
  leftBrow.rotation.z = isMale ? -0.05 : 0.05;
  head.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeom, hairMat);
  rightBrow.position.set(0.068, 0.06, headDepth * 0.5 + 0.01);
  rightBrow.rotation.z = isMale ? 0.05 : -0.05;
  head.add(rightBrow);

  // Smile / Lips
  const smileGeom = makeGeom(new THREE.BoxGeometry(0.09, 0.025, 0.02));
  const smileMesh = new THREE.Mesh(smileGeom, lipsMat);
  smileMesh.position.set(0, -0.07, headDepth * 0.5 + 0.005);
  head.add(smileMesh);

  // Ears
  const earGeom = makeGeom(new THREE.BoxGeometry(0.03, 0.07, 0.05));
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.position.set(-headWidth * 0.51, 0, 0);
  head.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.position.set(headWidth * 0.51, 0, 0);
  head.add(rightEar);

  // Earrings (Female default or config)
  if (config.earrings || (!isMale && config.earrings !== false)) {
    const earringGeom = makeGeom(new THREE.TorusGeometry(0.03, 0.007, 12, 24));
    const leftEarring = new THREE.Mesh(earringGeom, goldMat);
    leftEarring.position.set(-headWidth * 0.53, -0.04, 0);
    head.add(leftEarring);

    const rightEarring = new THREE.Mesh(earringGeom, goldMat);
    rightEarring.position.set(headWidth * 0.53, -0.04, 0);
    head.add(rightEarring);
  }

  // Hair / Headwear
  const hairGroup = new THREE.Group();
  head.add(hairGroup);

  if (isMale) {
    if (config.hairStyle === 'afro') {
      const afroGeom = makeGeom(new THREE.SphereGeometry(headWidth * 0.68, 20, 20));
      const afroMesh = new THREE.Mesh(afroGeom, hairMat);
      afroMesh.position.set(0, 0.08, -0.02);
      hairGroup.add(afroMesh);
    } else if (config.hairStyle === 'fila') {
      // Delta / Yoruba traditional tall cap
      const filaGeom = makeGeom(new THREE.CylinderGeometry(headWidth * 0.48, headWidth * 0.52, 0.2, 16));
      const filaMesh = new THREE.Mesh(filaGeom, accentMat);
      filaMesh.position.set(0, headHeight * 0.5 + 0.08, 0);
      filaMesh.rotation.z = -0.15; // stylish tilt
      hairGroup.add(filaMesh);

      // Gold embroidery band
      const trimGeom = makeGeom(new THREE.TorusGeometry(headWidth * 0.5, 0.02, 12, 32));
      const trimMesh = new THREE.Mesh(trimGeom, goldMat);
      trimMesh.rotation.x = Math.PI / 2;
      trimMesh.position.set(0, headHeight * 0.5, 0);
      hairGroup.add(trimMesh);
    } else if (config.hairStyle === 'dreads') {
      // Locs hanging
      const locGeom = makeGeom(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8));
      for (let i = -3; i <= 3; i++) {
        const loc = new THREE.Mesh(locGeom, hairMat);
        loc.position.set(i * 0.045, 0.02, -headDepth * 0.45);
        loc.rotation.x = 0.25;
        hairGroup.add(loc);
      }
      const topCap = new THREE.Mesh(
        makeGeom(new THREE.SphereGeometry(headWidth * 0.58, 16, 16)),
        hairMat
      );
      topCap.position.set(0, 0.07, -0.02);
      hairGroup.add(topCap);
    } else {
      // Sharp Fade (Default)
      const fadeTop = new THREE.Mesh(
        makeGeom(new THREE.BoxGeometry(headWidth * 1.02, 0.06, headDepth * 1.02)),
        hairMat
      );
      fadeTop.position.set(0, headHeight * 0.5 + 0.01, 0);
      hairGroup.add(fadeTop);

      const fadeBack = new THREE.Mesh(
        makeGeom(new THREE.BoxGeometry(headWidth * 1.01, headHeight * 0.6, 0.04)),
        hairMat
      );
      fadeBack.position.set(0, 0.06, -headDepth * 0.51);
      hairGroup.add(fadeBack);
    }
  } else {
    // Female Hair / Headwear
    if (config.hairStyle === 'gele') {
      // Royal Gele - Architectural Pleated Nigerian Headwrap
      const geleBase = new THREE.Mesh(
        makeGeom(new THREE.CylinderGeometry(headWidth * 0.6, headWidth * 0.55, 0.16, 24)),
        outfitMat
      );
      geleBase.position.set(0, headHeight * 0.48 + 0.04, -0.02);
      hairGroup.add(geleBase);

      // Angled flared fan wings of the Gele
      const wingGeom = makeGeom(new THREE.BoxGeometry(headWidth * 1.6, 0.18, 0.04));
      const wing1 = new THREE.Mesh(wingGeom, accentMat);
      wing1.position.set(0, headHeight * 0.58 + 0.08, 0);
      wing1.rotation.set(-0.2, 0, 0.18);
      hairGroup.add(wing1);

      const wing2 = new THREE.Mesh(wingGeom, outfitMat);
      wing2.position.set(0, headHeight * 0.58 + 0.14, -0.04);
      wing2.rotation.set(-0.3, 0, -0.15);
      hairGroup.add(wing2);

      // Shimmering Gold edging on Gele crown
      const geleCrown = new THREE.Mesh(
        makeGeom(new THREE.TorusGeometry(headWidth * 0.65, 0.025, 12, 32)),
        goldMat
      );
      geleCrown.rotation.x = Math.PI / 2;
      geleCrown.position.set(0, headHeight * 0.55, 0);
      hairGroup.add(geleCrown);
    } else if (config.hairStyle === 'bun') {
      // Braided high bun
      const bunGeom = makeGeom(new THREE.SphereGeometry(headWidth * 0.45, 16, 16));
      const bunMesh = new THREE.Mesh(bunGeom, hairMat);
      bunMesh.position.set(0, headHeight * 0.5 + 0.14, -0.02);
      hairGroup.add(bunMesh);

      const scalpMesh = new THREE.Mesh(
        makeGeom(new THREE.BoxGeometry(headWidth * 1.02, 0.05, headDepth * 1.02)),
        hairMat
      );
      scalpMesh.position.set(0, headHeight * 0.5 + 0.01, 0);
      hairGroup.add(scalpMesh);
    } else if (config.hairStyle === 'puff') {
      // Afro Puff
      const puffGeom = makeGeom(new THREE.SphereGeometry(headWidth * 0.55, 18, 18));
      const puffMesh = new THREE.Mesh(puffGeom, hairMat);
      puffMesh.position.set(0, headHeight * 0.5 + 0.16, -0.04);
      hairGroup.add(puffMesh);

      // Headband
      const bandMesh = new THREE.Mesh(
        makeGeom(new THREE.TorusGeometry(headWidth * 0.53, 0.02, 12, 32)),
        accentMat
      );
      bandMesh.rotation.x = Math.PI / 2;
      bandMesh.position.set(0, headHeight * 0.46, 0);
      hairGroup.add(bandMesh);
    } else {
      // Box Braids (Default female)
      const scalpMesh = new THREE.Mesh(
        makeGeom(new THREE.BoxGeometry(headWidth * 1.02, 0.06, headDepth * 1.02)),
        hairMat
      );
      scalpMesh.position.set(0, headHeight * 0.5 + 0.01, 0);
      hairGroup.add(scalpMesh);

      // Braids flowing down back and sides
      const braidGeom = makeGeom(new THREE.CylinderGeometry(0.018, 0.014, 0.45, 8));
      const braidPositions = [
        [-headWidth * 0.48, -0.06, 0.05],
        [-headWidth * 0.48, -0.06, -0.05],
        [headWidth * 0.48, -0.06, 0.05],
        [headWidth * 0.48, -0.06, -0.05],
        [-0.08, -0.08, -headDepth * 0.48],
        [0, -0.08, -headDepth * 0.48],
        [0.08, -0.08, -headDepth * 0.48],
      ];
      braidPositions.forEach(([x, y, z]) => {
        const braid = new THREE.Mesh(braidGeom, hairMat);
        braid.position.set(x, y, z);
        hairGroup.add(braid);

        // Gold braid cuff
        const cuff = new THREE.Mesh(
          makeGeom(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 8)),
          goldMat
        );
        cuff.position.set(x, y - 0.15, z);
        hairGroup.add(cuff);
      });
    }
  }

  // Accessories: Sunglasses
  let sunglassesMesh: THREE.Object3D | undefined;
  if (config.sunglasses) {
    const shadesGroup = new THREE.Group();
    const shadesMat = makeMat({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.85 });
    const lensGeom = makeGeom(new THREE.BoxGeometry(0.09, 0.05, 0.02));

    const leftLens = new THREE.Mesh(lensGeom, shadesMat);
    leftLens.position.set(-0.068, 0.01, headDepth * 0.5 + 0.025);
    shadesGroup.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeom, shadesMat);
    rightLens.position.set(0.068, 0.01, headDepth * 0.5 + 0.025);
    shadesGroup.add(rightLens);

    const frameBridge = new THREE.Mesh(
      makeGeom(new THREE.BoxGeometry(0.05, 0.012, 0.02)),
      goldMat
    );
    frameBridge.position.set(0, 0.025, headDepth * 0.5 + 0.025);
    shadesGroup.add(frameBridge);

    head.add(shadesGroup);
    sunglassesMesh = shadesGroup;
  }

  // Accessories: Gold Chain (Male default or config)
  let goldChainMesh: THREE.Object3D | undefined;
  if (config.goldChain) {
    const chainGeom = makeGeom(new THREE.TorusGeometry(0.12, 0.015, 12, 32));
    const chainMesh = new THREE.Mesh(chainGeom, goldMat);
    chainMesh.rotation.x = Math.PI / 2.3;
    chainMesh.position.set(0, chestHeight * 0.44, 0.04);
    torso.add(chainMesh);
    goldChainMesh = chainMesh;
  }

  // Accessories: Coral Beads (Delta/Edo royal Ivie beads)
  let coralBeadsMesh: THREE.Object3D | undefined;
  if (config.coralBeads || (!isMale && config.coralBeads !== false)) {
    const beadsGroup = new THREE.Group();
    // Multi-strand coral bead necklace
    const strand1 = new THREE.Mesh(
      makeGeom(new THREE.TorusGeometry(0.125, 0.018, 12, 32)),
      coralMat
    );
    strand1.rotation.x = Math.PI / 2.2;
    strand1.position.set(0, chestHeight * 0.45, 0.04);
    beadsGroup.add(strand1);

    const strand2 = new THREE.Mesh(
      makeGeom(new THREE.TorusGeometry(0.155, 0.018, 12, 32)),
      coralMat
    );
    strand2.rotation.x = Math.PI / 2.1;
    strand2.position.set(0, chestHeight * 0.38, 0.06);
    beadsGroup.add(strand2);

    torso.add(beadsGroup);
    coralBeadsMesh = beadsGroup;
  }

  // Arms and Forearms
  const armRadius = isMale ? 0.055 : 0.048;
  const armLen = 0.26;

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-chestWidth * 0.54 - armRadius, chestHeight * 0.36, 0);
  torso.add(leftArm);

  const leftShoulderMesh = new THREE.Mesh(
    makeGeom(new THREE.CylinderGeometry(armRadius, armRadius, armLen, 12)),
    outfitMat
  );
  leftShoulderMesh.position.y = -armLen * 0.5;
  leftArm.add(leftShoulderMesh);

  const leftForearm = new THREE.Group();
  leftForearm.position.y = -armLen;
  leftArm.add(leftForearm);

  const leftForearmMesh = new THREE.Mesh(
    makeGeom(new THREE.CylinderGeometry(armRadius * 0.95, armRadius * 0.85, armLen, 12)),
    skinMat
  );
  leftForearmMesh.position.y = -armLen * 0.5;
  leftForearm.add(leftForearmMesh);

  // Wristwatch on left wrist
  if (config.wristwatch) {
    const watchMesh = new THREE.Mesh(
      makeGeom(new THREE.CylinderGeometry(armRadius * 0.98, armRadius * 0.98, 0.04, 16)),
      goldMat
    );
    watchMesh.position.y = -armLen * 0.82;
    leftForearm.add(watchMesh);
  }

  const leftHand = new THREE.Group();
  leftHand.position.y = -armLen;
  leftForearm.add(leftHand);

  const leftHandMesh = new THREE.Mesh(
    makeGeom(new THREE.BoxGeometry(0.065, 0.08, 0.04)),
    skinMat
  );
  leftHandMesh.position.y = -0.04;
  leftHand.add(leftHandMesh);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(chestWidth * 0.54 + armRadius, chestHeight * 0.36, 0);
  torso.add(rightArm);

  const rightShoulderMesh = new THREE.Mesh(
    makeGeom(new THREE.CylinderGeometry(armRadius, armRadius, armLen, 12)),
    outfitMat
  );
  rightShoulderMesh.position.y = -armLen * 0.5;
  rightArm.add(rightShoulderMesh);

  const rightForearm = new THREE.Group();
  rightForearm.position.y = -armLen;
  rightArm.add(rightForearm);

  const rightForearmMesh = new THREE.Mesh(
    makeGeom(new THREE.CylinderGeometry(armRadius * 0.95, armRadius * 0.85, armLen, 12)),
    skinMat
  );
  rightForearmMesh.position.y = -armLen * 0.5;
  rightForearm.add(rightForearmMesh);

  // Coral wrist bead on right arm (if coral beads on)
  if (config.coralBeads) {
    const wristBead = new THREE.Mesh(
      makeGeom(new THREE.TorusGeometry(armRadius * 0.95, 0.015, 8, 20)),
      coralMat
    );
    wristBead.rotation.x = Math.PI / 2;
    wristBead.position.y = -armLen * 0.82;
    rightForearm.add(wristBead);
  }

  const rightHand = new THREE.Group();
  rightHand.position.y = -armLen;
  rightForearm.add(rightHand);

  const rightHandMesh = new THREE.Mesh(
    makeGeom(new THREE.BoxGeometry(0.065, 0.08, 0.04)),
    skinMat
  );
  rightHandMesh.position.y = -0.04;
  rightHand.add(rightHandMesh);

  // Legs and Feet
  const legLen = 0.44;
  const legRadius = isMale ? 0.075 : 0.065;

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-chestWidth * 0.26, 0.44, 0);
  body.add(leftLeg);

  const leftPantsMesh = new THREE.Mesh(
    makeGeom(new THREE.CylinderGeometry(legRadius, legRadius * 0.9, legLen, 14)),
    pantsMat
  );
  leftPantsMesh.position.y = -legLen * 0.5;
  leftLeg.add(leftPantsMesh);

  const leftFoot = new THREE.Mesh(
    makeGeom(new THREE.BoxGeometry(legRadius * 2.1, 0.07, 0.18)),
    makeMat({ color: shoeColor, roughness: 0.35, metalness: 0.3 })
  );
  leftFoot.position.set(0, -legLen, 0.04);
  leftLeg.add(leftFoot);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(chestWidth * 0.26, 0.44, 0);
  body.add(rightLeg);

  const rightPantsMesh = new THREE.Mesh(
    makeGeom(new THREE.CylinderGeometry(legRadius, legRadius * 0.9, legLen, 14)),
    pantsMat
  );
  rightPantsMesh.position.y = -legLen * 0.5;
  rightLeg.add(rightPantsMesh);

  const rightFoot = new THREE.Mesh(
    makeGeom(new THREE.BoxGeometry(legRadius * 2.1, 0.07, 0.18)),
    makeMat({ color: shoeColor, roughness: 0.35, metalness: 0.3 })
  );
  rightFoot.position.set(0, -legLen, 0.04);
  rightLeg.add(rightFoot);

  // Procedural Animation Update Method
  const update = (_delta: number, time: number, pose: string, energy: number) => {
    // Energy fatigue factor
    const isExhausted = energy < 25;
    const speedMultiplier = isExhausted ? 0.6 : 1.0;
    const t = time * speedMultiplier;

    if (pose === 'walk') {
      // Natural Warri Street Hustler Walk (alternating leg stride & arm swing)
      const walkCycle = t * 9.0;
      const legStride = Math.sin(walkCycle) * 0.58;
      const armStride = Math.sin(walkCycle) * 0.46;

      body.position.y = Math.abs(Math.sin(walkCycle)) * 0.04;
      body.rotation.z = Math.sin(walkCycle) * 0.025;

      torso.rotation.x = 0.08; // Lean slightly into the hustle
      torso.rotation.y = Math.sin(walkCycle) * 0.06;

      head.rotation.x = -0.02;
      head.rotation.y = -Math.sin(walkCycle) * 0.04;
      head.rotation.z = 0;

      // Alternating legs with natural bend
      leftLeg.rotation.set(legStride, 0, 0);
      rightLeg.rotation.set(-legStride, 0, 0);

      // Arms swing in counter-balance
      leftArm.rotation.set(-armStride, 0, 0.12);
      leftForearm.rotation.set(-0.35 + Math.max(0, -armStride) * 0.3, 0, 0);

      rightArm.rotation.set(armStride, 0, -0.12);
      rightForearm.rotation.set(-0.35 + Math.max(0, armStride) * 0.3, 0, 0);
    } else if (pose === 'groove') {
      // Warri Afrobeat Groove Dance
      const beat = t * 5.5;
      body.position.y = Math.abs(Math.sin(beat)) * 0.04;
      body.rotation.z = Math.sin(beat) * 0.06;

      torso.rotation.x = 0.05 + Math.sin(beat * 2) * 0.04;
      torso.rotation.y = Math.cos(beat) * 0.12;

      head.rotation.y = -Math.cos(beat) * 0.1;
      head.rotation.z = -Math.sin(beat) * 0.05;

      leftArm.rotation.x = -0.3 + Math.sin(beat) * 0.35;
      leftArm.rotation.z = 0.25 + Math.cos(beat) * 0.2;
      leftForearm.rotation.x = -0.8 + Math.sin(beat + 0.5) * 0.4;

      rightArm.rotation.x = -0.3 - Math.sin(beat) * 0.35;
      rightArm.rotation.z = -0.25 - Math.cos(beat) * 0.2;
      rightForearm.rotation.x = -0.8 - Math.sin(beat + 0.5) * 0.4;

      leftLeg.rotation.x = -Math.sin(beat) * 0.12;
      rightLeg.rotation.x = Math.sin(beat) * 0.12;
    } else if (pose === 'wave') {
      // Friendly Wave / Welcome to Warri
      body.position.y = 0;
      body.rotation.z = 0;
      torso.rotation.set(0, 0, 0);

      // Head tilted kindly
      head.rotation.set(0.04, -0.08, -0.06);

      // Left arm on waist
      leftArm.rotation.set(0.1, 0, 0.35);
      leftForearm.rotation.set(-0.8, -0.3, 0);

      // Right arm waving high
      rightArm.rotation.set(0, 0, -1.8);
      rightForearm.rotation.set(0, 0, -0.6 + Math.sin(t * 8) * 0.4);

      leftLeg.rotation.set(0, 0, 0);
      rightLeg.rotation.set(0, 0, 0);
    } else if (pose === 'proud') {
      // Confident Street Boss / Queen Stance
      body.position.y = 0;
      body.rotation.z = 0;

      torso.rotation.set(-0.06, 0, 0); // Chest out
      torso.scale.set(1.02, 1.02, 1.02);
      head.rotation.set(-0.08, Math.sin(t * 1.5) * 0.08, 0); // Head held high

      // Hands on hips
      leftArm.rotation.set(0.1, 0.1, 0.48);
      leftForearm.rotation.set(-1.1, -0.4, 0);

      rightArm.rotation.set(0.1, -0.1, -0.48);
      rightForearm.rotation.set(-1.1, 0.4, 0);

      leftLeg.rotation.set(0, 0, -0.05);
      rightLeg.rotation.set(0, 0, 0.05);
    } else if (pose === 'hustle') {
      // Determined Fist Pump
      body.position.y = Math.abs(Math.sin(t * 4)) * 0.02;
      torso.rotation.set(0.04, 0, 0);
      head.rotation.set(0, 0, 0);

      leftArm.rotation.set(0, 0, 0.15);
      leftForearm.rotation.set(-0.4, 0, 0);

      // Right fist pump
      rightArm.rotation.set(-0.4, 0, -1.3);
      rightForearm.rotation.set(-0.9 + Math.sin(t * 6) * 0.3, 0, 0);

      leftLeg.rotation.set(0, 0, 0);
      rightLeg.rotation.set(0, 0, 0);
    } else {
      // Natural Idle Breathing & Gentle Sway
      const breath = Math.sin(t * 2.2);
      body.position.y = 0;
      body.rotation.z = Math.sin(t * 1.1) * 0.02;

      torso.scale.y = 1 + breath * 0.018;
      torso.scale.z = 1 + breath * 0.015;
      torso.rotation.x = isExhausted ? 0.08 : 0; // Slump if tired

      head.rotation.y = Math.sin(t * 0.8) * 0.06;
      head.rotation.x = (isExhausted ? 0.06 : 0) + Math.cos(t * 1.6) * 0.02;
      head.rotation.z = Math.sin(t * 0.6) * 0.02;

      leftArm.rotation.set(0, 0, 0.1 + Math.sin(t * 2.2) * 0.025);
      leftForearm.rotation.set(-0.25, 0, 0);

      rightArm.rotation.set(0, 0, -0.1 - Math.sin(t * 2.2) * 0.025);
      rightForearm.rotation.set(-0.25, 0, 0);

      leftLeg.rotation.set(0, 0, 0);
      rightLeg.rotation.set(0, 0, 0);
    }
  };

  const dispose = () => {
    geometriesToDispose.forEach((g) => g.dispose());
    materialsToDispose.forEach((m) => m.dispose());
  };

  return {
    root,
    pedestal,
    body,
    head,
    torso,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    sunglassesMesh,
    goldChainMesh,
    coralBeadsMesh,
    update,
    dispose,
  };
}
