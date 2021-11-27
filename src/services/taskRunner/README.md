# TaskRunner Service
This service simply hosts bull workers, it does not create cron tasks, it does not enqueue tasks at all, it just spins up workers for the queues.
Management of the defined tasks and enqueeing is handled by the TaskManager service