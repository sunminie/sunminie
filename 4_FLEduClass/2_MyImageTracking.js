import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';
import {loadGLTF, loadAudio} from '../applications/libs/loader.js';

document.addEventListener('DOMContentLoaded',() => {
    const start = async () => {

        // initialize MindAR 
        const mindarThree = new MindARThree({
            container: document.body,
            imageTargetSrc: './2_MyTarget.mind', //Image Target Compiler로 받은 파일 주소!
          });
        const {renderer, scene, camera} = mindarThree;

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        //load 3d Model
        const gltf = await loadGLTF('./3dModels/gltf_groot_dancing/scene.gltf'); //내가 넣으려는 3D 모델 주소
        gltf.scene.scale.set(0.5, 0.5, 0.5);//3D 모델 파일 크기
        gltf.scene.rotation.set(Math.PI/2,0,0);//3D 모델 회전
        gltf.scene.position.set(0, 0, 0.1);//3D 모델 위치 미세 조정

        //create anchor
        const Anchor = mindarThree.addAnchor(0);
        Anchor.group.add(gltf.scene);
        
        const audioClip = await loadAudio("./2_BGM.mp3"); //Background Music

        const listner = new THREE.AudioListener();
        camera.add(listner);

        const audio2 = new THREE.Audio(listner);
        const audioClip2 = await loadAudio("./2_Voice.mp3");//모델을 터치했을 때 나오는 소리
        audio2.setBuffer(audioClip2)


        const audio = new THREE.PositionalAudio(listner);

        document.body.addEventListener('click',(e) =>{
            const mouseX = (e.clientX / window.innerWidth)*2-1;
            const mouseY = -1*(e.clientY / window.innerHeight)*2+1; //top to bottom이 아니라 bottom to top임. 그래서 반전 시켜줘야 함
            const mouse = new THREE.Vector2(mouseX,mouseY);

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(scene.children, true); //오브젝트 하나를 지정하는게 아니라, scene에 나타나는 오브젝트 전체를 지정해야 나중에 편함

            if (intersects.length > 0) {
                console.log("on click found")
                audio2.play()
            }
        });

        Anchor.group.add(audio);
        Anchor.group.add(audio2); //UI에서는 얘가 필요없는 것 같음...


        audio.setRefDistance(100); //값을 바꿔가면서 테스트해봐야 함
        audio.setBuffer(audioClip);
        audio.setLoop(true);

        //Multiple Detection을 사용할 때 필요할 수 있음
        Anchor.onTargetFound = () => {
            console.log("on target found");
            audio.play();
        }

        Anchor.onTargetLost = () => {
            console.log("on target lost");
            audio.pause();
        }


        //gltf.animations
        const mixer = new THREE.AnimationMixer(gltf.scene);
        const action = mixer.clipAction(gltf.animations[0]); //첫 번째 애니메이션 실행
        action.play();

        const clock = new THREE.Clock();

        // start AR
        await mindarThree.start();
        renderer.setAnimationLoop(()=>{
            const delta = clock.getDelta();
            mixer.update(delta); //애니메이션 매 프레임마다 불러오기
            renderer.render(scene, camera);
        });
    }
    start();
});