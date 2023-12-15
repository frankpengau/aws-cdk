import { DlqDestinationConfig, IEventSourceDlq, IEventSourceMapping, IFunction } from '../../aws-lambda';
import * as s3 from '../../aws-s3';

/**
 * An S3 dead letter bucket destination configuration for a Lambda event source
 */
export class S3OnFailureDestination implements IEventSourceDlq {
  constructor(private readonly bucket: s3.ICfnBucket) {
  }

  /**
   * Returns a destination configuration for the DLQ
   */
  public bind(_target: IEventSourceMapping, targetHandler: IFunction): DlqDestinationConfig {
    s3.Bucket.fromCfnBucket(this.bucket).grantReadWrite(targetHandler);

    return {
      destination: this.bucket.attrArn,
    };
  }
}