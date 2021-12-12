import { FastifyInstance } from "fastify";
import { IService } from "../../common/interfaces/service";
import {createBullBoard} from "@bull-board/api";
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import bull from "bull";
import { QueueNames } from "../../common/queues/queueNameConstants";

export class BullBoardService implements IService {
  private readonly _serverAdapter: FastifyAdapter;
  private readonly _queues: bull.Queue[] = [];
  private readonly _queueAdapters: Array<BullAdapter>;

  constructor(private _app: FastifyInstance) {
    this._queues = [
      bull(QueueNames.HEARTBEAT_QUEUE),
      bull(QueueNames.FETCH_QUEUE)
    ]
    this._queueAdapters = this._queues.map(queue => new BullAdapter(queue));
    this._serverAdapter = new FastifyAdapter();
    //TODO: put this on a proper sub path
    this._serverAdapter.setBasePath('/taskboard');
    this._app.register(this._serverAdapter.registerPlugin(), { basePath: '/', prefix: '/taskboard' });
    createBullBoard({
      serverAdapter: this._serverAdapter,
      queues: this._queueAdapters
    });
  }

  start(): Promise<void> {
    return Promise.resolve();
  }
  stop(): Promise<void> {
    return Promise.resolve();
  }
  async destroy(): Promise<void> {
    await Promise.all(this._queues.map(queue => queue.close()));
  }
}