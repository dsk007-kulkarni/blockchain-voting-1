import React from 'react';
import axios from 'axios';
import { server } from '../serverChoose';
import generatePriPub from '../helper/clientPriPub';
import generateCipher from '../helper/encryptor';
import generateHmac from '../helper/generateMAC';

import {
  Button,
  Container,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';
import { useSnackbar } from 'notistack';
import Page from './page';
import VoterContext from '../VoterContext';

var data = [
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Prime_Minister_of_India_Narendra_Modi.jpg',
    title: 'Narendra Modi',
    id: 'modi',
    party: 'BJP',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Prime_Minister_of_India_Narendra_Modi.jpg',
    title: 'Mamta Banerjee',
    id: 'banerjee',
    party: 'BJP',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Prime_Minister_of_India_Narendra_Modi.jpg',
    title: 'vijay Patil',
    id: 'patil',
    party: 'BJP',
  },
];

export default function ShopSearch() {
  const { enqueueSnackbar } = useSnackbar();
  const { voterDetails } = React.useContext(VoterContext);
  const [party, setParty] = React.useState(data);
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    // setProducts((products) => [...products]);
  }, []);

  // if (!voterDetails) {
  //   enqueueSnackbar('Verify Aadhar First', {
  //     variant: 'info',
  //   });
  //   window.location.href = '/';
  // }

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const submit = (e) => {
    e.preventDefault();
    const { party } = e.target.elements;

    const { clientPri, clientPub, sharedKey } = generatePriPub(
      voterDetails.serverPub
    );
    const timestamp = Date.now();
    console.log(clientPri, clientPub, sharedKey);

    const hmac = generateHmac(
      {
        to: party.value,
        timestamp,
        serverTime: voterDetails.timestamp,
      },
      sharedKey
    );

    const payload = generateCipher(
      {
        data: {
          from: '',
          to: party.value,
        },
        timestamp,
        serverTime: timestamp - voterDetails.timestamp,
      },
      sharedKey,
      voterDetails.token
    );

    axios
      .post(
        server + '/secured/vote',
        {
          payload: `${payload}|${hmac}`,
        },
        {
          headers: {
            authorization: voterDetails.token,
            publickey: clientPub,
          },
        }
      )
      .then((res_) => {
        console.log(res_.data);
        if (res_.status === 200) {
          if (res_.data === 'success') {
            enqueueSnackbar('Vote Success', {
              variant: 'success',
            });
          } else if (res_.data === 'Already Voted') {
            throw new Error('voted');
          }
        } else {
          throw new Error('Failed');
        }
      })
      .catch((err) => {
        console.log(err);
        if (err.message === 'voted') {
          enqueueSnackbar('Multiple Votes Not Allowed', {
            variant: 'info',
          });
        } else {
          enqueueSnackbar('Vote failed', {
            variant: 'error',
          });
        }
      });
  };

  return voterDetails ? (
    <Page title="Vote">
      <p className="text-center font-black text-3xl">List of Candidates</p>
      <Container>
        <form onSubmit={submit}>
          <FormControl style={{ width: '100%' }}>
            <RadioGroup value={value} name="party" onChange={handleChange}>
              <table className="text-left table-auto">
                <thead className="bg-black flex text-white w-100 border-2 border-gray-700 rounded-lg">
                  <tr className="flex w-full mb-4 text-center">
                    <th className="p-4 w-1/4">Image</th>
                    <th className="p-4 w-1/4">Name</th>
                    <th className="p-4 w-1/4">Candidate Name</th>
                    <th className="p-4 w-1/4">Choose</th>
                  </tr>
                </thead>
                <tbody className="bg-grey-light flex flex-col items-center overflow-y-scroll w-100">
                  {party.map((par_) => {
                    return (
                      <tr className="text-center flex w-full mb-4">
                        <td className="flex justify-center p-4 w-1/4">
                          <img
                            src={par_.src}
                            height={100}
                            width={100}
                            alt={par_.id}
                          />
                        </td>
                        <td className="flex justify-center p-4 w-1/4">
                          <span className="inline-block align-middle">
                            {par_.party}
                          </span>
                        </td>
                        <td className="flex justify-center p-4 w-1/4">
                          <span className="inline-block align-middle">
                            {par_.title}
                          </span>
                        </td>
                        <td className="flex justify-center p-4 w-1/4">
                          <FormControlLabel
                            value={par_.id}
                            control={<Radio />}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </RadioGroup>
          </FormControl>
          <FormControl style={{ justifyContent: 'center' }}>
            <Button
              style={{ margin: 70 }}
              color="primary"
              type="submit"
              variant="contained"
            >
              Submit Vote
            </Button>
          </FormControl>
        </form>
      </Container>
    </Page>
  ) : (
    <>No aadhar details were submitted, hence you cannot vote </>
  );
}
