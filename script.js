let data = [];
const addButton = document.getElementById("add-button");
const trainButton = document.getElementById("train-button");
const predictButton = document.getElementById("predict-button");
const rpsWinnerButtons = document.getElementsByClassName("rps-winner");
const rpsNextWinnerButtons = document.getElementsByClassName("rps-next-winner");
const trainDataContainer = document.getElementById("train-data-json-container");
const resultLabel1 = document.getElementById("result-label-1");
const resultConfidence1 = document.getElementById("result-confidence-1");
const resultLabel2 = document.getElementById("result-label-2");
const resultConfidence2 = document.getElementById("result-confidence-2");
const resultLabel3 = document.getElementById("result-label-3");
const resultConfidence3 = document.getElementById("result-confidence-3");

let nn;

if (localStorage.getItem("rps-train-data")) {
  trainDataContainer.value = localStorage.getItem("rps-train-data");
  data = JSON.parse(trainDataContainer.value);
}

for (const rpsBtn of rpsWinnerButtons) {
  rpsBtn.addEventListener("click", () => {
    if (rpsBtn.dataset.clicked === "yes") {
      rpsBtn.style.outlineColor = rpsBtn.dataset.color;
      rpsBtn.dataset.clicked = "no";
    } else {
      Array.from(rpsWinnerButtons).forEach((otherRpsButton) => {
        otherRpsButton.style.outlineColor = otherRpsButton.dataset.color;
        otherRpsButton.dataset.clicked = "no";
      });

      rpsBtn.style.outlineColor = "black";
      rpsBtn.dataset.clicked = "yes";
    }
  });
}

for (const rpsBtn of rpsNextWinnerButtons) {
  rpsBtn.addEventListener("click", () => {
    if (rpsBtn.dataset.clicked === "yes") {
      rpsBtn.style.outlineColor = rpsBtn.dataset.color;
      rpsBtn.dataset.clicked = "no";
    } else {
      Array.from(rpsNextWinnerButtons).forEach((otherRpsButton) => {
        otherRpsButton.style.outlineColor = otherRpsButton.dataset.color;
        otherRpsButton.dataset.clicked = "no";
      });

      rpsBtn.style.outlineColor = "black";
      rpsBtn.dataset.clicked = "yes";
    }
  });
}

addButton.addEventListener("click", () => {
  const winner = Array.from(rpsWinnerButtons).find((btn) => btn.style.outlineColor === "black")
    ?.dataset.value;

  const nextWinner = Array.from(rpsNextWinnerButtons).find(
    (btn) => btn.style.outlineColor === "black",
  )?.dataset.value;

  if (winner && nextWinner) {
    data.push({ winner, nextWinner });
    trainDataContainer.value = JSON.stringify(data, null, 2);

    Array.from(rpsWinnerButtons).forEach((otherRpsButton) => {
      otherRpsButton.style.outlineColor = otherRpsButton.dataset.color;
      otherRpsButton.dataset.clicked = "no";
    });

    Array.from(rpsNextWinnerButtons).forEach((otherRpsButton) => {
      otherRpsButton.style.outlineColor = otherRpsButton.dataset.color;
      otherRpsButton.dataset.clicked = "no";
    });
  }

  try {
    const data = JSON.parse(trainDataContainer.value);

    if (data instanceof Array && data.length > 5) {
      trainButton.removeAttribute("disabled");
    }
  } catch (error) {
    alert(error);
  }
});

trainButton.addEventListener("click", (event) => {
  event.preventDefault();
  train();
});

function train() {
  let data = null;

  try {
    data = JSON.parse(trainDataContainer.value);
  } catch (error) {
    alert(error);
  }

  if (!data) {
    return;
  }

  trainButton.setAttribute("disabled", true);

  const tid = setTimeout(() => {
    localStorage.setItem("rps-train-data", trainDataContainer.value);

    try {
      const options = {
        task: "classification",
        debug: false,
      };

      nn = ml5.neuralNetwork(options);

      data.forEach((item) => {
        const inputs = {
          winner: item.winner,
        };

        const output = {
          nextWinner: item.nextWinner,
        };

        nn.addData(inputs, output);
      });

      nn.normalizeData();

      const trainingOptions = {
        epochs: 32,
        batchSize: 12,
      };

      nn.train(trainingOptions, finishedTraining);
    } catch (error) {
      alert(error);
      console.log(error);
    }

    trainButton.removeAttribute("disabled");

    clearTimeout(tid);
  }, 200);
}

function finishedTraining() {
  console.log("training finished");
}

predictButton.addEventListener("click", (event) => {
  event.preventDefault();

  resultLabel1.innerText = "";
  resultLabel1.dataset.color = "";
  resultConfidence1.innerText = "";

  resultLabel2.innerText = "";
  resultLabel2.dataset.color = "";
  resultConfidence2.innerText = "";

  resultLabel3.innerText = "";
  resultLabel3.dataset.color = "";
  resultConfidence3.innerText = "";

  const tid = setTimeout(() => {
    try {
      const data = JSON.parse(trainDataContainer.value);

      if (data instanceof Array && data.length > 5) {
        const lastResult = data[data.length - 1];

        classify({ winner: lastResult.winner });
      }
    } catch (error) {
      alert(error);
    }

    clearTimeout(tid);
  }, 200);
});

function classify({ winner }) {
  try {
    const input = {
      winner,
    };

    nn.classify(input, handleResults);
  } catch (error) {
    alert(error);
  }
}

function handleResults(error, result) {
  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(result, null, 2));

  resultLabel1.innerText = result[0]?.label.toUpperCase();

  resultLabel1.dataset.color =
    result[0]?.label === "rock" ? "skyblue" : result[0]?.label === "paper" ? "lightgreen" : "red";

  resultConfidence1.innerText = `Confidence: ${(result[0].confidence * 100).toFixed(2)}%`;

  if (result[1]) {
    resultLabel2.innerText = result[1].label.toUpperCase();

    resultLabel2.dataset.color =
      result[1].label === "rock" ? "skyblue" : result[1]?.label === "paper" ? "lightgreen" : "red";

    resultConfidence2.innerText = `Confidence: ${(result[1].confidence * 100).toFixed(2)}%`;
  }

  if (result[2]) {
    resultLabel3.innerText = result[2].label.toUpperCase();

    resultLabel3.dataset.color =
      result[2].label === "rock" ? "skyblue" : result[2].label === "paper" ? "lightgreen" : "red";

    resultConfidence3.innerText = `Confidence: ${(result[2].confidence * 100).toFixed(2)}%`;
  }

  predictButton.innerHTML = "Done";

  const tid = setTimeout(() => {
    predictButton.innerHTML = "Predict";

    clearTimeout(tid);
  }, 1000);
}

try {
  const data = JSON.parse(trainDataContainer.value);

  if (data instanceof Array && data.length > 5) {
    train();
  }
} catch (error) {
  alert(error);
}
