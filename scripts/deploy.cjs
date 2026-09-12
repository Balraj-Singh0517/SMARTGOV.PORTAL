const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const defaultRelayer = signers.length > 1 ? signers[1] : deployer;

  const adminAddress = process.env.BLOCKCHAIN_ADMIN_ADDRESS || deployer.address;
  const relayerAddress = process.env.BLOCKCHAIN_RELAYER_ADDRESS || defaultRelayer.address;

  console.log("Deploying SmartGovAudit with Admin:", adminAddress, "Relayer:", relayerAddress);

  const SmartGovAudit = await hre.ethers.getContractFactory("SmartGovAudit");
  const contract = await SmartGovAudit.deploy(adminAddress, relayerAddress);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("SmartGovAudit deployed successfully to:", contractAddress);

  // Read the compiled artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/SmartGovAudit.sol/SmartGovAudit.json"
  );

  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifact.abi;
  }

  // Export deployment metadata for backend service consumption
  const deployMeta = {
    address: contractAddress,
    admin: adminAddress,
    relayer: relayerAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    abi: abi,
  };

  const outputDir = path.join(__dirname, "../server/services/blockchain");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "contractDeployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployMeta, null, 2));
  console.log("Saved deployment metadata to:", outputPath);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
