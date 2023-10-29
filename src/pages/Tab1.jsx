import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';
import React, { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { IonButton } from '@ionic/react';
import { ethers , JsonRpcProvider} from "ethers";
import { useContractWrite } from 'wagmi';

export function useInterval(callback, delay){
  const savedCallback = useRef();

  useEffect(() => {
      savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
      function tick(){
          savedCallback.current()
      }

      if (delay !== null){
          const id = setInterval(tick, delay);
          return () => {
              clearInterval(id);
          };
      }
  }, [callback, delay]);
}

async function getCircuit(name) {
  const circuit = await fetch('/Circuit.json');
  let response = circuit.json()
  // console.log("source = " + noirSource)

  return response
}

async function getAbi() {
  let abi = await fetch('/Holder.json') // Relative path to the JSON file in the public folder
  let response = abi.json()
  return response
}

const Tab1 = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  
  // const [abi, setAbi] = useState(null)
  const [proof, setProof] = useState(null)

  const printCurrentPosition = async () => {
    const coordinates = await Geolocation.getCurrentPosition();
  
    // console.log('Current position:', coordinates);
    setLongitude(Math.floor(coordinates.coords.longitude * 3600));
    setLatitude(Math.floor(coordinates.coords.latitude * 3600));
    console.log("latitude: " + latitude + " longitude: " + longitude);
  };

  useInterval(async () => {
    // console.log("fetching location data")
    await printCurrentPosition();
  }, 300)

  // useEffect(() => {
  //   async function setMyAbi(){
  //     const contractAbi = await getAbi()
  //     setAbi(contractAbi.abi)
  //   }
  //   setMyAbi();
  // }, []);

  // const { data, isLoading, isSuccess, write } = useContractWrite({
  //   address: "0x056280Adf06d183782FC94b9a3CF4A638df0098A",
  //   abi: abi,
  //   functionName: 'claim',
  // })

  async function claim() {
    const ETH_SENDER_KEY = "95baae6e12db4c37b9eac5e713057482f14311a77c726d3dd396b20ca618d913"
    
    const goerliProvider = new JsonRpcProvider("https://goerli.infura.io/v3/b65da94ced3047b4ba15bd2d63bf3079");
    await goerliProvider.ready

    const sender = new ethers.Wallet(
        ETH_SENDER_KEY,
        goerliProvider
    )

    const contractAddress = "0x056280Adf06d183782FC94b9a3CF4A638df0098A"
    // console.log(abi)
    const abi = await getAbi()
    const holderContract = new ethers.Contract(contractAddress, abi.abi, sender);

    const circuit = await getCircuit('main');
    const backend = new BarretenbergBackend(circuit);
    const noir = new Noir(circuit, backend);

    // const input = {latitude: 185424, longitude: 453 };
    const input = {latitude: latitude, longitude: parseInt(Math.abs(longitude)) };
    try {
        // Generate proof
        const { proof, publicInputs } = await noir.generateFinalProof(input);
        // console.log("proof = " + proof + " ");
        // console.log("Public inputs = " + publicInputs + " ");
        const verification = await holderContract.claim(proof, []);
        // const value = write({
        //   args: [proof, []],
        //   from: '0xF33F0e723f1bF45250Fb3aB88a3C37545F4df489',
        // })
        
        // resolve(verification);
        console.log(verification);
    } catch (err) {
        console.log(err);
        alert("Wrong coordinates!")
        // reject(new Error("Couldn't verify proof on-chain"));
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>TokenomGo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>
        <h1>Current Location Coordinates</h1>
          <p id="coordinates">Latitude in seconds: {latitude} Longitude in seconds: {longitude}</p>
        <IonButton className="button" onClick={claim}>Claim</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
