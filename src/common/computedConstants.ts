import cluster from 'cluster';
import os from 'os';

const COMPUTED_CONSTANTS = {
    id: cluster.worker ? cluster.worker.id : os.hostname(),
}
export default COMPUTED_CONSTANTS;