const Docker = require('dockerode');

const docker = new Docker();

// Função para obter o consumo de recursos dos containers
const getContainerStats = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    const statsPromises = containers.map(async (containerInfo) => {
      const container = docker.getContainer(containerInfo.Id);
      const stats = await container.stats({ stream: false });

      let diskUsage = await getDiskUsage(containerInfo.Id);
      let memoryUsage = stats.memory_stats.usage;
      let cpuUsage = calculateCPUPercent(stats);

      return {
        name: containerInfo.Names[0],
        id: containerInfo.Id,
        cpu: cpuUsage,
        memory: {
          total: stats.memory_stats.limit,
          usage: memoryUsage,
        },
        diskUsage: diskUsage,
      };
    });

    return Promise.all(statsPromises);
  } catch (error) {
    console.error(`Erro ao obter estatísticas dos containers: ${error.message}`);
    return [];
  }
};

// Função para calcular o uso de CPU dos containers
const calculateCPUPercent = (stats) => {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const numCPUs = stats.cpu_stats.online_cpus;

  if (systemDelta > 0 && cpuDelta > 0) {
    return ((cpuDelta / systemDelta) * numCPUs * 100).toFixed(2);
  }
  return 0;
};

// Função para obter o uso de disco de um container
const getDiskUsage = async (containerId) => {
  try {
    const layers = await docker.getContainer(containerId).inspect({format: '{{.GraphDriver.Data.LowerDir}}'});
    const diskUsage = await calculateDiskUsage(layers);
    return diskUsage;
  } catch (error) {
    console.error(`Erro ao obter estatísticas do container ${containerId}: ${error.message}`);
    return 0;
  }
};

// Função para calcular o uso total de disco de um container
const calculateDiskUsage = async (layers) => {
  try {
    let totalUsage = 0;
    const layersArray = layers.split(':');
    for (const layer of layersArray) {
      const usage = await si.diskUsage(layer); // Ajuste necessário aqui para importar o 'systeminformation'
      totalUsage += usage.used;
    }
    return (totalUsage / (1024 ** 3)).toFixed(2); // Convertendo para GB
  } catch (error) {
    console.error(`Erro ao calcular o uso de disco: ${error.message}`);
    return 0;
  }
};

module.exports = {
  getContainerStats,
};
