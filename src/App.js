import logo from "./OrbitLaunchLogo.jpg";
import "./App.css";
import { useState, useEffect } from "react";
import orbitABI from "./orbitABI.json";
import Contract from "web3-eth-contract";
import Web3 from "web3";
import covers from "./covers.json";
import Overlay from "react-image-overlay";
import background from "./Stars.png";
import mergeImages from "merge-images";

function App() {
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let image = new Image();
        image.src = e.target.result;
        image.onload = () => {
          resolve(reader.result);
        };
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const imageUpload = (e) => {
    const file = e.target.files[0];
    if (typeof file !== "undefined" && /\.(jpe?g|png|gif)$/i.test(file.name)) {
      getBase64(file)
        .then(async (base64) => {
          base64 = await resizeImage(base64, 1080, 1080);
          localStorage["fileBase64"] = base64;
          setImg(base64);
        })
        .catch((e) => {
          alert(e);
        });
    }
  };

  const [account, setAccount] = useState();
  let [img, setImg] = useState(localStorage["fileBase64"]);
  let [final, setFinal] = useState(localStorage["final"]);
  let [coverIndex, setCoverIndex] = useState(localStorage["coverIndex"]);
  let [balance, setBalance] = useState();
  // let provider = Web3.givenProvider ? Web3.givenProvider : config.chainURL;
  let provider = Web3.givenProvider;
  Contract.setProvider(provider);

  let orbitContract = new Contract(
    orbitABI,
    "0x20bf68C512D5c8125687069347878ce0e7f01748"
  );

  const resizeImage = (base64Str) => {
    return new Promise((resolve) => {
      let img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1080;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 1080, 1080);
        resolve(canvas.toDataURL());
      };
    });
  };

  const connectWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.enable().then((e) => setAccount(e[0]));
      updateBalance();
    }
  };
  const updateBalance = () => {
    if (account) {
      orbitContract.methods
        .balanceOf(account)
        .call({ from: account })
        .then((e) => {
          setBalance(Web3.utils.fromWei(e));
        });
    }
  };

  useEffect(() => {
    if (window.web3) {
      connectWeb3();
      window.web3 = new Web3(window.ethereum);
      window.ethereum.on("accountsChanged", function (accounts) {
        setAccount(accounts[0]);
        updateBalance();
      });
      orbitContract.events.Transfer({ from: "latest" }, () => {
        updateBalance();
      });
    }
  }, []);

  useEffect(() => {
    if (account) {
      updateBalance();
    }
  }, [account]);

  useEffect(() => {
    if (img && coverIndex >= 0) {
      mergeImages([
        img,
        covers[coverIndex] ? covers[coverIndex].img : logo,
      ]).then((b64) => {
        setFinal(b64);
      });
    }
  }, [img, coverIndex]);

  const getCoverClass = (index) => {
    if (index === coverIndex) {
      return "Selected-img";
    }
    if (balance >= covers[index].min) {
      return "Cover-img";
    }
    return "Cover-locked";
  };

  return (
    <div className="App" style={{ backgroundImage: `url(${background})` }}>
      <header className="App-header">
        <img src={final || img || logo} className="App-logo" />
        <label className="custom-file-upload">
          <input
            type="file"
            id="imageFile"
            name="imageFile"
            accept=".gif,.jpg,.jpeg,.png"
            onChange={imageUpload}
          />
          Upload Avatar
        </label>
        <label>{"Orbit Balance: " + balance}</label>
      </header>
      <div className="Covers-container">
        {covers.map((item, index) => (
          <div className="Covers" key={index}>
            <img
              className={getCoverClass(index)}
              src={item.img}
              alt={item.alt}
              onClick={(e) => {
                setCoverIndex(index);
                localStorage["coverIndex"] = index;
              }}
            />
            <h5>{item.cost}</h5>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
