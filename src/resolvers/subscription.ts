import { IResolvers } from "graphql-tools";
import { CHANGE_VOTES } from '../config/constants';

const subscription: IResolvers = {
    Subscription: {
        changeVotes: {
            subscribe: (_: void, __: any, { pubsub}) => {
                return pubsub.asyncIterator(CHANGE_VOTES);
            }
        }
    }
}

export default subscription;