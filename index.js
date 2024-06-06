require('dotenv').config(); // Carregar variáveis de ambiente do arquivo .env

const express = require('express');
const path = require('path');
const si = require('systeminformation');
const Docker = require('dockerode');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 5000; // Utiliza a variável de ambiente PORT ou o valor padrão 5000
const folderPath = process.env.FOLDER_PATH || '/home/jieff/dev/ksys/scan'; // Utiliza a variável de ambiente FOLDER_PATH ou o valor padrão

const docker = new Docker();

app.use(express.static(path.join(__dirname, '')));

app.get('/info/api', async (req, res) => {
  try {
    const [cpu, memory, osInfo, currentLoad, disk, containerStats] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.currentLoad(),
      si.fsSize(),
      getDockerStats(),
    ]);

    const folderDiskUsage = await getFolderDiskUsage(folderPath);

    res.json({
      cpu,
      memory,
      os: osInfo,
      currentLoad,
      disk,
      containers: containerStats,
      folderDiskUsage,
    });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.get('/disk-usage', async (req, res) => {
  try {
    let requestedFolderPath = req.query.folderPath || folderPath;

    const diskUsage = await getFolderDiskUsage(requestedFolderPath);
    res.json({ folderPath: requestedFolderPath, diskUsage });
  } catch (error) {
    console.error(`Erro ao obter o uso de disco da pasta: ${error.message}`);
    res.status(500).send(error.toString());
  }
});

app.get('/info', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/', (req, res) => {
  res.send('Bem-vindo à API de informações do sistema!');
});

async function getDockerStats() {
  try {
    const containers = await docker.listContainers();
    const stats = await Promise.all(
      containers.map(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.Id);
        const data = await container.stats({ stream: false });
        return {
          name: containerInfo.Names[0],
          cpu: (data.cpu_stats.cpu_usage.total_usage / data.cpu_stats.system_cpu_usage) * 100,
          memory: {
            total: data.memory_stats.limit,
            usage: data.memory_stats.usage,
          },
          diskUsage: await getContainerDiskUsage(containerInfo.Id),
        };
      })
    );
    return stats;
  } catch (error) {
    console.error('Erro ao obter informações dos containers:', error);
    return [];
  }
}

async function getContainerDiskUsage(containerId) {
  return 0; // Implementação necessária
}

async function getFolderDiskUsage(folderPath) {
  return new Promise((resolve, reject) => {
    exec(`du -sm ${folderPath}`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        const usage = parseInt(stdout.split('\t')[0], 10);
        resolve(usage); // Uso em MB
      }
    });
  });
}

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
