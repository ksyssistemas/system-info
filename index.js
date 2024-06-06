const express = require('express');
const path = require('path');
const si = require('systeminformation');
const Docker = require('dockerode');

const app = express();
const port = 5000;
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

    const folderDiskUsage = await getFolderDiskUsage('/home/jieff/dev/ksys/scan');

    res.json({
      cpu,
      memory,
      os: osInfo,
      currentLoad,
      disk,
      containers: containerStats,
      folderDiskUsage
    });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.get('/disk-usage', async (req, res) => {
  try {
    let folderPath = req.query.folderPath;

    if (!folderPath) {
      folderPath = '/home/jieff/dev/ksys/scan';
    }

    const diskUsage = await getFolderDiskUsage(folderPath);
    res.json({ folderPath, diskUsage });
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
    const stats = await Promise.all(containers.map(async (containerInfo) => {
      const container = docker.getContainer(containerInfo.Id);
      const data = await container.stats({ stream: false });
      return {
        name: containerInfo.Names[0],
        cpu: (data.cpu_stats.cpu_usage.total_usage / data.cpu_stats.system_cpu_usage) * 100,
        memory: {
          total: data.memory_stats.limit,
          usage: data.memory_stats.usage
        },
        diskUsage: await getContainerDiskUsage(containerInfo.Id)
      };
    }));
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
  const { exec } = require('child_process');
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
