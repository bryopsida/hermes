import cluster from 'cluster';
import { randomUUID } from 'crypto';

const COMPUTED_CONSTANTS = {
    id: cluster.worker ? cluster.worker.id : randomUUID()
}
export default COMPUTED_CONSTANTS;